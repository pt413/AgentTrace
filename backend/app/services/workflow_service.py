from collections import deque
from datetime import datetime, timezone
import json
from time import perf_counter
from uuid import uuid4

from pydantic import ValidationError

from app.agents.http_client import AgentExecutionError
from app.agents.runtime import AgentRuntime
from app.schemas.span import Span
from app.schemas.trace import TraceCreate
from app.schemas.workflow import WorkflowRunRequest, WorkflowRunResult
from app.services.trace_service import TraceService


def now():
    return datetime.now(timezone.utc)


class WorkflowService:
    def __init__(self, runtime: AgentRuntime, traces: TraceService):
        self.runtime = runtime
        self.traces = traces

    def run(self, request: WorkflowRunRequest) -> WorkflowRunResult:
        nodes = {node.id: node for node in request.nodes}
        outgoing = {node_id: [] for node_id in nodes}
        incoming = set()
        for edge in request.edges:
            outgoing[edge.source].append(edge.target)
            incoming.add(edge.target)
        entries = [request.entry_node_id] if request.entry_node_id else [node_id for node_id in nodes if node_id not in incoming]
        if not entries:
            raise ValueError("This workflow has no starting agent. Choose an entry agent for its loop.")
        # Resolve and validate every agent before any operation makes an external request.
        prepared = {}
        for node in request.nodes:
            try:
                prepared[node.id] = self.runtime.prepare(node)
            except ValidationError as exc:
                fields = ", ".join(".".join(map(str, error["loc"])) for error in exc.errors())
                raise ValueError(f"Configure {node.name}: invalid or missing {fields}") from None
            except (KeyError, ValueError) as exc:
                raise ValueError(f"Configure {node.name}: {str(exc)}") from None

        trace_id = str(uuid4())
        root = Span(id=str(uuid4()), name=request.name, span_type="workflow", started_at=now(), status="running", input=request.input)
        spans = [root]
        outputs = {}
        queue = deque((node_id, request.input, root.id) for node_id in entries)
        started = perf_counter()
        steps = 0
        failure = None
        while queue:
            if steps >= request.max_steps:
                failure = f"Execution stopped at the {request.max_steps}-step limit. Check loops or increase the limit."
                break
            remaining = 120 - (perf_counter() - started)
            if remaining <= 0:
                failure = "Execution stopped at the 120-second run limit"
                break
            node_id, value, parent_id = queue.popleft()
            node = nodes[node_id]
            steps += 1
            span = Span(id=str(uuid4()), parent_span_id=parent_id, name=node.name,
                        span_type="llm" if node.agent_id == "llm" else "agent",
                        started_at=now(), status="running", input=value,
                        metadata={"workflow_node_id": node.id, "agent_id": node.agent_id, "step": steps})
            span_started = perf_counter()
            try:
                result = self.runtime.execute(node, prepared[node_id], value,
                                              {"trace_id": trace_id, "node_id": node_id, "step": steps}, min(60, remaining))
                if len(json.dumps(result.output, allow_nan=False).encode("utf-8")) > 2 * 1024 * 1024:
                    raise AgentExecutionError("Agent output exceeds the 2 MB limit")
                span.output = result.output
                span.model = result.model
                for key, count in result.usage.items():
                    setattr(span, key, count)
                span.status = "completed"
                if outgoing[node_id]:
                    # Each incoming delivery invokes its target separately; branches do not join implicitly.
                    queue.extend((target, result.output, span.id) for target in outgoing[node_id])
                else:
                    outputs[node_id] = result.output
            except AgentExecutionError as exc:
                failure = str(exc)
                span.status = "failed"
                span.error = {"message": failure}
            except Exception:
                failure = "Agent execution failed unexpectedly; check the agent configuration and response format"
                span.status = "failed"
                span.error = {"message": failure}
            span.ended_at = now()
            span.duration_ms = round((perf_counter() - span_started) * 1000, 3)
            spans.append(span)
            if failure:
                break

        root.ended_at = now()
        root.duration_ms = round((perf_counter() - started) * 1000, 3)
        root.status = "failed" if failure else "completed"
        root.output = outputs
        root.error = {"message": failure} if failure else None
        trace = self.traces.create_trace(TraceCreate(
            id=trace_id, name=request.name, status=root.status,
            started_at=root.started_at, ended_at=root.ended_at, duration_ms=root.duration_ms,
            metadata={"source": "workflow", "steps": steps, "max_steps": request.max_steps,
                      "connections": [edge.model_dump() for edge in request.edges]}, spans=spans,
        ))
        return WorkflowRunResult(trace=trace, outputs=outputs, steps=steps)

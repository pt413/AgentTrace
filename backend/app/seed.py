"""Development-only traces, isolated from routing and storage behavior."""

from app.schemas.span import Span
from app.schemas.trace import TraceCreate
from app.services.trace_service import TraceService


def seed_demo_traces(service: TraceService) -> None:
    service.create_trace(
        TraceCreate(
            id="demo-review-pr-417", name="Review PR #417", status="completed", duration_ms=2840,
            metadata={"repository": "acme/payments", "pull_request": 417},
            spans=[
                Span(id="review-agent", name="Code Review Agent", span_type="agent", status="completed", duration_ms=2840, input={"pr": 417}, output={"verdict": "changes requested"}),
                Span(id="fetch-pr", parent_span_id="review-agent", name="Fetch Pull Request", span_type="tool", status="completed", duration_ms=320, input={"number": 417}, output={"files": 12}, metadata={"tool": "github.get_pull_request"}),
                Span(id="project-context", parent_span_id="review-agent", name="Retrieve Project Context", span_type="retriever", status="completed", duration_ms=540, output={"documents": 6}),
                Span(id="analyze-code", parent_span_id="review-agent", name="Analyze Code", span_type="llm", status="completed", duration_ms=1760, model="gpt-5", prompt_tokens=3621, completion_tokens=1390, total_tokens=5011, cost=0.041, input={"task": "Find regressions"}, output={"findings": 2}),
                Span(id="generate-review", parent_span_id="analyze-code", name="Generate Review", span_type="llm", status="completed", duration_ms=680, model="gpt-5", prompt_tokens=1100, completion_tokens=310, total_tokens=1410, cost=0.012),
            ],
        )
    )
    service.create_trace(
        TraceCreate(
            id="demo-research-agent", name="Research Agent", status="failed", duration_ms=1950,
            metadata={"topic": "local-first observability"},
            spans=[
                Span(id="research-agent", name="Research Agent", span_type="agent", status="failed", duration_ms=1950),
                Span(id="plan-research", parent_span_id="research-agent", name="Plan Research", span_type="llm", status="completed", duration_ms=410, model="gpt-5-mini", prompt_tokens=610, completion_tokens=270, total_tokens=880),
                Span(id="search-web", parent_span_id="research-agent", name="Search Web", span_type="tool", status="completed", duration_ms=620, metadata={"tool": "web.search"}, output={"results": 8}),
                Span(id="retrieve-documents", parent_span_id="search-web", name="Retrieve Documents", span_type="retriever", status="failed", duration_ms=510, error={"message": "Vector index request timed out", "type": "TimeoutError"}),
                Span(id="generate-answer", parent_span_id="research-agent", name="Generate Answer", span_type="custom", status="skipped", duration_ms=0, metadata={"reason": "Upstream retriever failed"}),
            ],
        )
    )

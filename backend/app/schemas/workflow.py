from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.trace import TraceDetail


class WorkflowNode(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=100)
    agent_id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=100)
    config: dict[str, Any] = Field(default_factory=dict)


class WorkflowEdge(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: str
    target: str


class WorkflowRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(default="Untitled workflow", min_length=1, max_length=100)
    nodes: list[WorkflowNode] = Field(min_length=1, max_length=100)
    edges: list[WorkflowEdge] = Field(default_factory=list, max_length=200)
    input: Any = None
    entry_node_id: str | None = None
    max_steps: int = Field(default=30, ge=1, le=100)

    @model_validator(mode="after")
    def check_references(self):
        ids = {node.id for node in self.nodes}
        if len(ids) != len(self.nodes):
            raise ValueError("Node IDs must be unique")
        pairs = set()
        for edge in self.edges:
            if edge.source not in ids or edge.target not in ids:
                raise ValueError("Connections must reference nodes in this workflow")
            pair = (edge.source, edge.target)
            if pair in pairs:
                raise ValueError("Duplicate connection")
            pairs.add(pair)
        if self.entry_node_id is not None and self.entry_node_id not in ids:
            raise ValueError("Entry agent is not in this workflow")
        return self


class WorkflowRunResult(BaseModel):
    trace: TraceDetail
    outputs: dict[str, Any]
    steps: int

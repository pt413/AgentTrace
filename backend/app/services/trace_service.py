from uuid import uuid4

from app.repositories.trace_repository import InMemoryTraceRepository
from app.schemas.trace import TraceCreate, TraceDetail, TraceSummary


class TraceNotFoundError(Exception):
    pass


class TraceService:
    def __init__(self, repository: InMemoryTraceRepository) -> None:
        self.repository = repository

    def create_trace(self, payload: TraceCreate) -> TraceDetail:
        trace_id = payload.id or str(uuid4())
        spans = []
        span_ids = set()

        for span in payload.spans:
            if span.id in span_ids:
                raise ValueError(f"Duplicate span id: {span.id}")
            span_ids.add(span.id)
            span_data = span.model_dump()
            span_data["trace_id"] = trace_id
            spans.append(type(span)(**span_data))

        for span in spans:
            if span.parent_span_id and span.parent_span_id not in span_ids:
                raise ValueError(
                    f"Span '{span.id}' references unknown parent '{span.parent_span_id}'"
                )

        trace = TraceDetail(
            id=trace_id,
            name=payload.name,
            status=payload.status,
            started_at=payload.started_at,
            ended_at=payload.ended_at,
            duration_ms=payload.duration_ms,
            metadata=payload.metadata,
            span_count=len(spans),
            spans=spans,
        )
        return self.repository.create(trace)

    def list_traces(self) -> list[TraceSummary]:
        return [
            TraceSummary(**trace.model_dump(exclude={"spans"}))
            for trace in self.repository.list()
        ]

    def get_trace(self, trace_id: str) -> TraceDetail:
        trace = self.repository.get(trace_id)
        if trace is None:
            raise TraceNotFoundError(trace_id)
        return trace

from typing import Dict, List, Optional
from threading import Lock

from app.schemas.trace import TraceDetail


class InMemoryTraceRepository:
    """A deliberately small repository that can later be swapped for persistence."""

    def __init__(self) -> None:
        self._traces: Dict[str, TraceDetail] = {}
        self._lock = Lock()

    def create(self, trace: TraceDetail) -> TraceDetail:
        with self._lock:
            self._traces[trace.id] = trace.model_copy(deep=True)
            return trace

    def list(self) -> List[TraceDetail]:
        with self._lock:
            return list(self._traces.values())

    def get(self, trace_id: str) -> Optional[TraceDetail]:
        with self._lock:
            return self._traces.get(trace_id)

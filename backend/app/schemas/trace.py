from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .span import Span


class TraceCreate(BaseModel):
    id: Optional[str] = Field(default=None, min_length=1)
    name: str = Field(min_length=1)
    status: str = Field(default="completed", min_length=1)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_ms: Optional[float] = Field(default=None, ge=0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    spans: List[Span] = Field(default_factory=list)


class TraceSummary(BaseModel):
    id: str
    name: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_ms: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    span_count: int


class TraceDetail(TraceSummary):
    spans: List[Span] = Field(default_factory=list)

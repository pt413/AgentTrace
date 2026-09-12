from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class Span(BaseModel):
    """One observed operation within a trace."""

    id: str = Field(min_length=1)
    trace_id: Optional[str] = None
    parent_span_id: Optional[str] = None
    name: str = Field(min_length=1)
    span_type: str = Field(default="custom", min_length=1)
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_ms: Optional[float] = Field(default=None, ge=0)
    status: str = Field(default="completed", min_length=1)
    input: Optional[Any] = None
    output: Optional[Any] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    model: Optional[str] = None
    prompt_tokens: Optional[int] = Field(default=None, ge=0)
    completion_tokens: Optional[int] = Field(default=None, ge=0)
    total_tokens: Optional[int] = Field(default=None, ge=0)
    cost: Optional[float] = Field(default=None, ge=0)
    error: Optional[Any] = None

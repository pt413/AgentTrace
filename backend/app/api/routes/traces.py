from fastapi import APIRouter, HTTPException, Request, status

from app.schemas.trace import TraceCreate, TraceDetail, TraceSummary
from app.services.trace_service import TraceNotFoundError, TraceService

router = APIRouter(prefix="/api/v1/traces", tags=["traces"])


def get_service(request: Request) -> TraceService:
    return request.app.state.trace_service


@router.post("", response_model=TraceDetail, status_code=status.HTTP_201_CREATED)
def create_trace(payload: TraceCreate, request: Request) -> TraceDetail:
    try:
        return get_service(request).create_trace(payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc


@router.get("", response_model=list[TraceSummary])
def list_traces(request: Request) -> list[TraceSummary]:
    return get_service(request).list_traces()


@router.get("/{trace_id}", response_model=TraceDetail)
def get_trace(trace_id: str, request: Request) -> TraceDetail:
    try:
        return get_service(request).get_trace(trace_id)
    except TraceNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trace not found") from exc

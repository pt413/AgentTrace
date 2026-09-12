from fastapi import APIRouter, HTTPException, Request

from app.schemas.workflow import WorkflowRunRequest, WorkflowRunResult

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])


@router.post("/run", response_model=WorkflowRunResult, status_code=201)
def run_workflow(payload: WorkflowRunRequest, request: Request):
    try:
        return request.app.state.workflow_service.run(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None

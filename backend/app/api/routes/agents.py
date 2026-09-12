from fastapi import APIRouter, HTTPException, Request, Response

from app.agents.catalog import BUILTIN_AGENTS
from app.schemas.agent import ExternalAgent, ExternalAgentCreate

router = APIRouter(prefix="/api/v1/agents", tags=["agents"])


@router.get("")
def list_agents(request: Request):
    return {"builtin": BUILTIN_AGENTS, "external": request.app.state.agent_repository.list()}


@router.post("/external", response_model=ExternalAgent, status_code=201)
def register_agent(payload: ExternalAgentCreate, request: Request):
    return request.app.state.agent_repository.save(payload)


@router.put("/external/{agent_id}", response_model=ExternalAgent)
def update_agent(agent_id: str, payload: ExternalAgentCreate, request: Request):
    try:
        return request.app.state.agent_repository.save(payload, agent_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="External agent not found") from None


@router.delete("/external/{agent_id}", status_code=204)
def delete_agent(agent_id: str, request: Request):
    try:
        request.app.state.agent_repository.delete(agent_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="External agent not found") from None
    return Response(status_code=204)

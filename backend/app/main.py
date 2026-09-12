import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import traces_router
from app.repositories import InMemoryTraceRepository
from app.seed import seed_demo_traces
from app.services import TraceService
from app.agents.http_client import AgentHttpClient
from app.agents.runtime import AgentRuntime
from app.api.routes.agents import router as agents_router
from app.api.routes.workflows import router as workflows_router
from app.repositories.agent_repository import AgentRepository
from app.services.workflow_service import WorkflowService


# Loads backend/.env for local development. Deployed environment variables take
# precedence because python-dotenv does not override existing values by default.
load_dotenv(Path(__file__).resolve().parents[1] / ".env")


def create_app(seed_demo: bool = False) -> FastAPI:
    app = FastAPI(title="AgentTrace API", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_methods=["GET", "POST", "PUT", "DELETE"],
        allow_headers=["Content-Type"],
    )
    app.state.trace_service = TraceService(InMemoryTraceRepository())
    app.state.agent_repository = AgentRepository()
    app.state.workflow_service = WorkflowService(
        AgentRuntime(app.state.agent_repository, AgentHttpClient()), app.state.trace_service
    )
    if seed_demo:
        seed_demo_traces(app.state.trace_service)

    @app.get("/")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": "agenttrace"}

    app.include_router(traces_router)
    app.include_router(agents_router)
    app.include_router(workflows_router)
    return app


app = create_app(seed_demo=os.environ.get("AGENTTRACE_DEMO", "").lower() == "true")

from threading import Lock
from uuid import uuid4

from app.schemas.agent import ExternalAgent, ExternalAgentCreate


class AgentRepository:
    def __init__(self):
        self._agents: dict[str, ExternalAgent] = {}
        self._lock = Lock()

    def list(self) -> list[ExternalAgent]:
        with self._lock:
            return [agent.model_copy(deep=True) for agent in self._agents.values()]

    def get(self, agent_id: str) -> ExternalAgent:
        with self._lock:
            if agent_id not in self._agents:
                raise KeyError("External agent not found")
            return self._agents[agent_id].model_copy(deep=True)

    def save(self, payload: ExternalAgentCreate, agent_id: str | None = None) -> ExternalAgent:
        with self._lock:
            if agent_id is not None and agent_id not in self._agents:
                raise KeyError("External agent not found")
            agent = ExternalAgent(id=agent_id or f"external-{uuid4()}", **payload.model_dump())
            self._agents[agent.id] = agent
            return agent.model_copy(deep=True)

    def delete(self, agent_id: str):
        with self._lock:
            if agent_id not in self._agents:
                raise KeyError("External agent not found")
            del self._agents[agent_id]

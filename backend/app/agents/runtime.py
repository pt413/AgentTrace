import json
from dataclasses import dataclass, field
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.agents.http_client import AgentExecutionError, AgentHttpClient
from app.repositories.agent_repository import AgentRepository
from app.schemas.agent import validate_endpoint
from app.schemas.workflow import WorkflowNode


class Config(BaseModel):
    model_config = ConfigDict(extra="forbid")


class LLMConfig(Config):
    endpoint: str
    model: str = Field(min_length=1, max_length=100)
    system_prompt: str = "You are a helpful assistant."
    token_env: str = Field(default="", pattern=r"^([A-Za-z_][A-Za-z0-9_]*)?$")

    _endpoint = field_validator("endpoint")(validate_endpoint)


class TemplateConfig(Config):
    template: str = Field(default="{{input}}", min_length=1, max_length=100000)


class ExtractConfig(Config):
    path: str = Field(min_length=1, max_length=500)


class TransformConfig(Config):
    operation: Literal["trim", "uppercase", "lowercase"] = "trim"


@dataclass
class AgentResult:
    output: Any
    model: str | None = None
    usage: dict = field(default_factory=dict)


def as_text(value):
    return value if isinstance(value, str) else json.dumps(value, ensure_ascii=False)


class AgentRuntime:
    CONFIGS = {"llm": LLMConfig, "template": TemplateConfig, "json_extract": ExtractConfig, "text_transform": TransformConfig}

    def __init__(self, agents: AgentRepository, http_client: AgentHttpClient):
        self.agents = agents
        self.http = http_client

    def prepare(self, node: WorkflowNode):
        if node.agent_id in self.CONFIGS:
            return self.CONFIGS[node.agent_id].model_validate(node.config)
        if node.config:
            raise ValueError("External agent settings are managed in the agent library")
        return self.agents.get(node.agent_id)

    def execute(self, node: WorkflowNode, config, value, context: dict, timeout: float) -> AgentResult:
        if node.agent_id == "template":
            return AgentResult(config.template.replace("{{input}}", as_text(value)))
        if node.agent_id == "text_transform":
            text = as_text(value)
            operations = {"trim": str.strip, "uppercase": str.upper, "lowercase": str.lower}
            return AgentResult(operations[config.operation](text))
        if node.agent_id == "json_extract":
            try:
                result = json.loads(value) if isinstance(value, str) else value
                for part in config.path.split("."):
                    if isinstance(result, list) and part.isdigit():
                        result = result[int(part)]
                    elif isinstance(result, dict):
                        result = result[part]
                    else:
                        raise KeyError(part)
                return AgentResult(result)
            except (ValueError, KeyError, IndexError, TypeError):
                raise AgentExecutionError("Input is not valid JSON or the configured field path does not exist") from None
        if node.agent_id == "llm" or config.protocol == "chat_completions":
            messages = []
            if node.agent_id == "llm" and config.system_prompt:
                messages.append({"role": "system", "content": config.system_prompt})
            messages.append({"role": "user", "content": as_text(value)})
            response = self.http.post(config.endpoint, {"model": config.model, "messages": messages, "stream": False}, config.token_env, min(timeout, getattr(config, "timeout_seconds", 60)))
            try:
                content = response["choices"][0]["message"]["content"]
                if not isinstance(content, str):
                    raise TypeError()
                usage = response.get("usage") or {}
                usage = {key: usage[key] for key in ("prompt_tokens", "completion_tokens", "total_tokens") if isinstance(usage.get(key), int) and usage[key] >= 0}
                return AgentResult(content, config.model, usage)
            except (KeyError, IndexError, TypeError, AttributeError):
                raise AgentExecutionError("Expected a chat completion with choices[0].message.content") from None
        response = self.http.post(config.endpoint, {"input": value, "context": context}, config.token_env, min(timeout, config.timeout_seconds))
        if not isinstance(response, dict) or "output" not in response:
            raise AgentExecutionError('External agents must return a JSON object containing "output"')
        return AgentResult(response["output"])

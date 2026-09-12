from typing import Literal
from urllib.parse import urlsplit

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def validate_endpoint(value: str) -> str:
    url = urlsplit(value)
    if url.scheme not in {"http", "https"} or not url.hostname:
        raise ValueError("Use a complete http:// or https:// endpoint URL")
    if url.username or url.password or url.fragment or url.query:
        raise ValueError("URLs cannot contain credentials, query strings or fragments; use a token environment variable")
    try:
        url.port
    except ValueError as exc:
        raise ValueError("Invalid endpoint port") from exc
    return value


class ExternalAgentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    description: str = Field(default="", max_length=500)
    location: Literal["local", "online"]
    endpoint: str = Field(max_length=2048)
    protocol: Literal["agent_json", "chat_completions"] = "agent_json"
    model: str = Field(default="", max_length=100)
    token_env: str = Field(default="", pattern=r"^([A-Za-z_][A-Za-z0-9_]*)?$")
    timeout_seconds: float = Field(default=30, ge=1, le=60)

    _endpoint = field_validator("endpoint")(validate_endpoint)

    @model_validator(mode="after")
    def check_protocol(self):
        if self.protocol == "chat_completions" and not self.model:
            raise ValueError("A model is required for chat completions")
        if self.location == "online" and urlsplit(self.endpoint).scheme != "https":
            raise ValueError("Online endpoints require HTTPS; use Local for development HTTP services")
        return self


class ExternalAgent(ExternalAgentCreate):
    id: str

"""Minimal adapter example: uvicorn examples.local_agent:app --port 9000."""

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Example local agent")


class Invocation(BaseModel):
    input: Any
    context: dict = Field(default_factory=dict)


@app.post("/invoke")
def invoke(payload: Invocation):
    # Replace this operation with a call to your own agent/application.
    return {"output": {"answer": f"Local agent received: {payload.input}", "source": "local-example"}}

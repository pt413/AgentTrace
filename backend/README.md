# AgentTrace API

The API exposes an agent catalog, external-agent connections, workflow execution,
and execution traces. It starts empty by default. Registrations and traces are
held in memory, so use one backend process; restarting clears them.

## Run

```bash
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --host 127.0.0.1
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`. The local
`backend/.env` file is loaded at startup and is ignored by Git. Production
deployments should provide the same variables through their platform's secret
manager rather than a file. Environment variables already supplied by the
platform take precedence over `.env` values.

The API is served at `http://localhost:8000`.
Run commands above from `backend/`. The sole application entry point is
`app/main.py`. Interactive API documentation is at `/docs`.

Keep this development service on loopback: it has no authentication and invokes
the local/online endpoints you register. Browser access is allowed from
`http://localhost:3000` and `http://127.0.0.1:3000`.

Optional demo traces: set `AGENTTRACE_DEMO=true` before starting. This does not
populate the workflow editor.

## Endpoints

- `POST /api/v1/traces` creates a trace and its spans (`201`).
- `GET /api/v1/traces` lists trace summaries.
- `GET /api/v1/traces/{trace_id}` retrieves a trace with its spans (`404` if absent).
- `GET /api/v1/agents` lists built-in definitions and registered external agents.
- `POST /api/v1/agents/external` registers an endpoint (`201`, no invocation).
- `PUT /api/v1/agents/external/{id}` updates its configuration.
- `DELETE /api/v1/agents/external/{id}` deletes it (`204`; unknown ID is `404`).
- `POST /api/v1/workflows/run` executes the supplied nodes and edges (`201`) and
  returns `{trace, outputs, steps}`. Invalid graphs/settings return `422` before
  execution. Runtime failures return a recorded trace with status `failed`.

## Execution semantics

The runner executes each agent delivery in queue order. With no explicit entry,
all nodes without incoming connections receive the starting input. An explicit
`entry_node_id` starts only that node and its reachable successors. Every output
is forwarded to every outgoing connection. Multiple incoming deliveries invoke
the destination separately; this version does not merge inputs or execute
branches in parallel. `outputs` is keyed by terminal node ID and holds its last
result if it was invoked more than once. All invocation results remain in spans.

Cycles are permitted. A graph without a root needs an explicit entry node. The
runner stops on a failure, at `max_steps` (default 30, maximum 100), or when its
120-second execution budget is exhausted between steps. HTTP operations have
per-request timeouts up to 60 seconds; request/response data is limited to 2 MB.
Spans represent invocations, so each loop iteration gets a unique span with its
triggering invocation as parent. The original connection list is trace metadata.

## External agent contract

For `agent_json`, AgentTrace POSTs to the exact endpoint:

```json
{"input": "previous agent output", "context": {"trace_id": "...", "node_id": "...", "step": 1}}
```

The agent must return JSON containing `output` (any JSON value):

```json
{"output": {"answer": "Agent result"}}
```

Try a local endpoint without model credentials:

```bash
python -m uvicorn examples.local_agent:app --port 9000 --host 127.0.0.1
```

Register `http://localhost:9000/invoke` using **Local agent** in the UI. The local
option also permits self-hosted HTTP services; localhost is relative to the
backend machine. **Online agent** requires HTTPS. Listing/repository URLs and
downloadable skills (including marketplace items) require deployment and, where
necessary, an adapter implementing this contract; they are not installed or run
as local code by AgentTrace.

For `chat_completions`, supply the complete endpoint and a model. AgentTrace
sends `{model, messages, stream: false}` and expects
`choices[0].message.content`. The built-in LLM agent additionally supports system
instructions and records token usage returned by the provider.

For authenticated endpoints, put a provider key in `backend/.env`, for example
`OPENAI_API_KEY=...`, then enter only `OPENAI_API_KEY` in the connection or LLM
configuration. You can instead set it in the backend process environment, for
example `$env:MY_AGENT_TOKEN='your-token'` in PowerShell. The server sends the
value as a Bearer token. Secrets are not returned by the catalog or recorded in
trace configuration. Provider response bodies and URLs are omitted from HTTP
error messages; redirects are not followed. Inputs and outputs are recorded for
inspection, so agents should not echo secrets.

## Modules

`api/routes/` exposes APIs; `schemas/` validates requests; `repositories/` stores
traces/connections; `agents/` holds the built-in catalog, runtime and HTTP adapter;
`services/workflow_service.py` schedules agent invocations and records spans.

## Tests

```bash
python -m pytest tests -q
```

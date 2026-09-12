# AgentTrace frontend

AgentTrace has a workflow editor and an execution trace viewer. The workflow
canvas starts empty. Add agents from the library, configure them, connect their
handles, and run the workflow with text or JSON input.

## Run

```bash
npm install
cp .env.example .env
npm start
```

It expects the API at `http://localhost:8000`. Set `REACT_APP_API_BASE_URL` to
point to another AgentTrace API instance. On PowerShell, use
`Copy-Item .env.example .env`. `frontend/.env` is intentionally ignored by Git;
it may contain only public browser configuration. Never put an LLM/API key in a
`REACT_APP_*` variable because those values are bundled into the browser.

## Verify

```bash
npm test -- --watchAll=false --runInBand
npm run build
```

## Using the workflow screen

1. Drag a built-in agent onto the canvas, or click its **+** button.
2. Open **Settings** on the card to name and configure that instance.
3. Drag from the right handle of one agent to the left handle of another.
   Alternatively, use **Connections** on either card to select incoming and
   outgoing agents. Both controls update the same graph.
4. Enter the starting input and click **Run workflow**. Results appear on the
   right. **Inspect execution trace** opens the recorded spans, including errors.

Built-ins include an LLM agent (configure a chat completions endpoint and model),
a prompt template using `{{input}}`, a JSON field extractor (`items.0.text`), and
a text transformer (trim, uppercase, lowercase).

The external library has **Local agent** and **Online agent** forms. Supply a
running HTTP endpoint using the documented Agent JSON or chat completions
format. Saving registers it without invoking it; drag it onto the canvas to use
it. **Edit** updates or deletes that connection. Endpoint credentials are read
from named environment variables on the backend, never stored in browser state.

ClawHub/OpenClaw or other sourced agents need a deployed compatible endpoint or
an adapter; marketplace pages, skill packages, and repository URLs cannot be
invoked directly. See the backend README and `backend/examples/local_agent.py`.

The canvas stays intact while switching tabs, but resets on browser refresh.
External registrations and traces are in memory until the backend restarts.
There is no database or workflow persistence in this version.

## Source layout

- `src/App.js`: application entry and screen navigation.
- `src/features/workflows/`: editor, graph conversion, run panel, dialogs, and store.
- `src/features/agents/`: agent library and external connection form.
- `src/features/traces/`: read-only execution graph, run list, inspector, and store.
- `src/shared/`: API client and accessible dialog component.

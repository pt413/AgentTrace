import { useState } from 'react';
import { Dialog } from '../../shared/Dialog';
import { useWorkflowStore } from '../workflows/store';

export function ExternalAgentDialog({ agent, location = 'local' }) {
  const { closeDialog, saveExternal, removeExternal } = useWorkflowStore();
  const [form, setForm] = useState(() => agent ? { name: agent.name, description: agent.description, location: agent.location,
    endpoint: agent.endpoint, protocol: agent.protocol, model: agent.model, token_env: agent.token_env, timeout_seconds: agent.timeout_seconds } : {
    name: '', description: '', location, endpoint: '', protocol: 'agent_json', model: '', token_env: '', timeout_seconds: 30,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const change = event => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError(null);
    try { await saveExternal({ ...form, timeout_seconds: Number(form.timeout_seconds) }, agent?.id); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  const remove = async () => {
    setBusy(true); setError(null);
    try { await removeExternal(agent.id); }
    catch (err) { setError(err.message); setBusy(false); }
  };
  return <Dialog title={agent ? 'Edit external agent' : 'Connect an external agent'} onClose={closeDialog} busy={busy}>
    <form onSubmit={submit} className="agent-form"><fieldset disabled={busy}>
      <label>Name<input name="name" required maxLength={100} value={form.name} onChange={change} placeholder="My research agent" /></label>
      <label>Description<input name="description" maxLength={500} value={form.description} onChange={change} /></label>
      <label>Location<select name="location" value={form.location} onChange={change}><option value="local">Local / self-hosted</option><option value="online">Online service</option></select></label>
      <label>Endpoint URL<input name="endpoint" required type="url" value={form.endpoint} onChange={change} placeholder={form.location === 'local' ? 'http://localhost:9000/invoke' : 'https://your-agent.example/invoke'} /></label>
      <p className="helper">{form.location === 'local' ? 'Start your agent first. Localhost refers to the machine running the AgentTrace backend.' : 'Enter the HTTPS invocation endpoint of a deployed agent. For agents from ClawHub, OpenClaw or another source, deploy or expose a compatible API first. A listing or repository URL is not an invocation endpoint.'}</p>
      <label>API format<select name="protocol" value={form.protocol} onChange={change}><option value="agent_json">Agent JSON (input / output)</option><option value="chat_completions">Chat completions</option></select></label>
      {form.protocol === 'agent_json' ? <div className="contract-note"><p>AgentTrace sends:</p><pre>{'{ "input": "previous result", "context": { "trace_id": "...", "node_id": "...", "step": 1 } }'}</pre><p>Your endpoint returns:</p><pre>{'{ "output": "next result" }'}</pre><p>Input and output can be any JSON value.</p></div> : <><label>Model<input name="model" required value={form.model} onChange={change} /></label><p className="helper">Use the full chat completions endpoint. The API must accept model/messages and return choices[0].message.content.</p></>}
      <label>Bearer token environment variable (optional)<input name="token_env" value={form.token_env} onChange={change} pattern="[A-Za-z_][A-Za-z0-9_]*" placeholder="MY_AGENT_TOKEN" /></label>
      <p className="helper">Set the secret in the backend environment. Enter the variable name here, never the secret itself.</p>
      <label>Request timeout (seconds)<input name="timeout_seconds" required type="number" min={1} max={60} value={form.timeout_seconds} onChange={change} /></label>
      <p className="helper">Saving registers the endpoint without invoking it. It is called when you run a workflow. Connections are kept until the backend restarts.</p>
    </fieldset>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <div className="dialog-actions">{agent && <button type="button" className="danger-button" disabled={busy} onClick={remove}>Delete connection</button>}<button className="primary-button" disabled={busy} type="submit">{busy ? 'Saving...' : 'Save connection'}</button></div>
    </form>
  </Dialog>;
}

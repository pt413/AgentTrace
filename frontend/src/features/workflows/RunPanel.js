import { useWorkflowStore } from './store';

export function RunPanel({ onViewTrace }) {
  const { nodes, entryNodeId, maxSteps, inputText, inputMode, setField, running, run, error, result } = useWorkflowStore();
  const failure = result?.trace.spans.find(span => !span.parent_span_id)?.error;
  return <aside className="run-panel"><p className="eyebrow">EXECUTION</p><h2>Run your workflow</h2>
    <form className="agent-form" onSubmit={event => { event.preventDefault(); run(); }}>
      <fieldset disabled={running}>
        <label>Input format<select value={inputMode} onChange={event => setField('inputMode', event.target.value)}><option value="text">Text</option><option value="json">JSON</option></select></label>
        <label>Starting input<textarea rows={7} value={inputText} onChange={event => setField('inputText', event.target.value)} placeholder="What should your agents work on?" /></label>
        <label>Entry agent<select value={entryNodeId} onChange={event => setField('entryNodeId', event.target.value)}><option value="">Auto: all agents without incoming arrows</option>{nodes.map(node => <option key={node.id} value={node.id}>{node.data.name} ({node.id.slice(0, 8)})</option>)}</select></label>
        <label>Maximum steps<input type="number" min={1} max={100} required value={maxSteps} onChange={event => setField('maxSteps', Number(event.target.value))} /></label>
      </fieldset>
      <button className="primary-button run-button" type="submit" disabled={running || !nodes.length}>{running ? 'Running agents...' : 'Run workflow'}</button>
    </form>
    <p className="helper">Results pass to connected agents. Agents with no outgoing arrows return final outputs. A failure stops the run. Requests may take up to 60 seconds each.</p>
    {error && <p role="alert" className="inline-error">{error}</p>}
    {running && <p role="status" className="run-progress">Executing your agents. Results and traces appear when the run finishes.</p>}
    {result && <section className="run-result" aria-label="Run result"><div className="result-heading"><h3>Last run</h3><span className={`status status-${result.trace.status}`}>{result.trace.status}</span></div>
      <p className="helper">{result.steps} steps / {Math.round(result.trace.duration_ms)} ms</p>
      {failure && <p role="alert" className="inline-error">{failure.message}</p>}
      {Object.entries(result.outputs).map(([id, output]) => <div key={id}><h4>{nodes.find(node => node.id === id)?.data.name || id}</h4><pre>{typeof output === 'string' ? output : JSON.stringify(output, null, 2)}</pre></div>)}
      {!Object.keys(result.outputs).length && <p className="helper">No terminal output was produced.</p>}
      <button type="button" onClick={() => onViewTrace(result.trace.id)}>Inspect execution trace</button>
    </section>}
  </aside>;
}

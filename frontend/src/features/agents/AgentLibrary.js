import { useWorkflowStore } from '../workflows/store';

export function AgentLibrary() {
  const { builtin, external, catalogLoading, catalogError, running, loadCatalog, addAgent, openDialog } = useWorkflowStore();
  const card = agent => <article key={agent.id} className="agent-library-card" draggable={!running}
    onDragStart={event => { event.dataTransfer.setData('application/agenttrace', agent.id); event.dataTransfer.effectAllowed = 'copy'; }}>
    <div className="library-card-heading"><strong>{agent.name}</strong><button type="button" disabled={running} onClick={() => addAgent(agent.id)} aria-label={`Add ${agent.name} to workflow`}>+</button></div>
    <p>{agent.description || `${agent.location} HTTP agent`}</p>
    {agent.location && <div className="library-card-footer"><span>{agent.location} / {agent.protocol === 'agent_json' ? 'Agent JSON' : 'Chat API'}</span>
      <button type="button" disabled={running} onClick={() => openDialog({ type: 'external', agent })}>Edit</button></div>}
  </article>;

  return <aside className="agent-library">
    <div className="panel-heading"><div><p className="eyebrow">AGENT LIBRARY</p><h2>Build your team</h2></div></div>
    <p className="helper">Drag an agent onto the canvas, or use + to add it.</p>
    {catalogLoading && <p role="status">Loading agents...</p>}
    {catalogError && <div className="inline-error" role="alert">{catalogError}<button type="button" onClick={loadCatalog}>Retry</button></div>}
    <h3>Built-in agents <span>{builtin.length}</span></h3>
    <div className="agent-library-list">{builtin.map(card)}</div>
    <h3>Your external agents <span>{external.length}</span></h3>
    <div className="external-actions"><button type="button" disabled={running} onClick={() => openDialog({ type: 'external', location: 'local' })}>+ Local agent</button>
      <button type="button" disabled={running} onClick={() => openDialog({ type: 'external', location: 'online' })}>+ Online agent</button></div>
    <div className="agent-library-list">{external.map(card)}</div>
    {!external.length && <p className="helper">Connect a running agent to make it available in this library.</p>}
  </aside>;
}

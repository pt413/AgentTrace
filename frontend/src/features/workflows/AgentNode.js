import { Handle, Position } from 'reactflow';
import { useWorkflowStore } from './store';

export function AgentNode({ id, data, selected }) {
  const openDialog = useWorkflowStore(state => state.openDialog);
  const running = useWorkflowStore(state => state.running);
  const spans = useWorkflowStore(state => state.result?.trace.spans);
  const span = spans?.filter(item => item.metadata?.workflow_node_id === id).slice(-1)[0];
  return <div className={`workflow-node ${selected ? 'selected' : ''}`} style={{ '--node-accent': data.accent }}>
    <Handle type="target" position={Position.Left} isConnectable={!running} />
    <div className="workflow-node-kind">{data.kind.replace('_', ' ')} {span && <span className={`status status-${span.status}`}>{span.status}</span>}</div>
    <strong title={data.name}>{data.name}</strong>
    <p>{data.description || 'Connected external agent'}</p>
    <div className="node-actions nodrag nopan"><button type="button" disabled={running} onClick={() => openDialog({ type: 'settings', nodeId: id })} aria-label={`Settings for ${data.name}`}>Settings</button>
      <button type="button" disabled={running} onClick={() => openDialog({ type: 'connections', nodeId: id })} aria-label={`Connections for ${data.name}`}>Connections</button></div>
    <Handle type="source" position={Position.Right} isConnectable={!running} />
  </div>;
}

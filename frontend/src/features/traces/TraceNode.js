import { Handle, Position } from 'reactflow';

export const TraceNode = ({ data, selected }) => (
  <div className={`trace-node ${selected ? 'trace-node-selected' : ''}`} style={{ '--node-accent': data.accent }}>
    <Handle type="target" position={Position.Left} isConnectable={false} />
    <div className="trace-node-type"><span className="type-dot" />{data.span_type || 'custom'}</div>
    <strong>{data.name}</strong>
    <div className="trace-node-meta"><span className={`status status-${data.status}`}>{data.status}</span><span>{data.durationLabel}</span></div>
    <Handle type="source" position={Position.Right} isConnectable={false} />
  </div>
);

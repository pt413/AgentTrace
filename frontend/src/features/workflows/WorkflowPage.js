import { useEffect } from 'react';
import { AgentLibrary } from '../agents/AgentLibrary';
import { ExternalAgentDialog } from '../agents/ExternalAgentDialog';
import { WorkflowCanvas } from './WorkflowCanvas';
import { RunPanel } from './RunPanel';
import { NodeSettingsDialog } from './NodeSettingsDialog';
import { ConnectionsDialog } from './ConnectionsDialog';
import { useWorkflowStore } from './store';

export function WorkflowPage({ onViewTrace }) {
  const { loadCatalog, name, setField, nodes, edges, clear, dialog, running } = useWorkflowStore();
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  const node = nodes.find(item => item.id === dialog?.nodeId);
  return <div className="workflow-page">
    <div className="workflow-topbar"><label>Workflow<input aria-label="Workflow name" maxLength={100} value={name} disabled={running} onChange={event => setField('name', event.target.value)} /></label><span>{nodes.length} agents / {edges.length} connections</span><button type="button" disabled={running || !nodes.length} onClick={clear}>Clear canvas</button></div>
    <main className="workflow-workspace"><AgentLibrary /><WorkflowCanvas /><RunPanel onViewTrace={onViewTrace} /></main>
    {dialog?.type === 'external' && <ExternalAgentDialog key={dialog.agent?.id || dialog.location} agent={dialog.agent} location={dialog.location} />}
    {dialog?.type === 'settings' && node && <NodeSettingsDialog key={node.id} node={node} />}
    {dialog?.type === 'connections' && node && <ConnectionsDialog key={node.id} node={node} />}
  </div>;
}

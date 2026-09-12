import { useCallback, useRef, useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import { AgentNode } from './AgentNode';
import { useWorkflowStore } from './store';
import 'reactflow/dist/style.css';

const nodeTypes = { agent: AgentNode };
export function WorkflowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, connect, addAgent, running, openDialog } = useWorkflowStore();
  const [flow, setFlow] = useState(null);
  const wrapper = useRef(null);
  const onDrop = useCallback(event => {
    event.preventDefault();
    const agentId = event.dataTransfer.getData('application/agenttrace');
    if (flow && agentId && !running) {
      const bounds = wrapper.current.getBoundingClientRect();
      addAgent(agentId, flow.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top }));
    }
  }, [flow, addAgent, running]);
  return <section className="workflow-canvas" aria-label="Workflow canvas" ref={wrapper}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onConnect={connect} onInit={setFlow} onDrop={onDrop} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; }}
      nodesDraggable={!running} nodesConnectable={!running} edgesUpdatable={false} deleteKeyCode={running ? null : ['Backspace', 'Delete']}
      onNodeDoubleClick={(_, node) => openDialog({ type: 'settings', nodeId: node.id })}
      minZoom={0.2} maxZoom={2} defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: 'arrowclosed' } }}>
      <Background color="#cbd5e1" gap={22} /><Controls showInteractive={false} /><MiniMap nodeColor={node => node.data.accent} />
    </ReactFlow>
    {!nodes.length && <div className="canvas-empty"><div className="empty-icon">+</div><h2>Your workflow starts here</h2><p>Drag a built-in agent or connect your own.<br />Link the handles to pass results between agents.</p></div>}
  </section>;
}

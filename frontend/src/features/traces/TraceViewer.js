import { useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap } from 'reactflow';
import { useTraceStore as useStore } from './store';
import { TraceNode } from './TraceNode';

import 'reactflow/dist/style.css';

const proOptions = { hideAttribution: true };
const nodeTypes = { traceNode: TraceNode };

export const TraceViewer = () => {
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  const selectSpan = useStore((state) => state.selectSpan);
  const selectedSpan = useStore((state) => state.selectedSpan);
  const selectedTrace = useStore((state) => state.selectedTrace);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const onNodeClick = useCallback((_, node) => selectSpan(node.id), [selectSpan]);

  return (
    <section className="graph-panel" aria-label="Execution graph">
      <div className="panel-heading">
        <div><p className="eyebrow">EXECUTION GRAPH</p><h2>{selectedTrace?.name || 'No trace selected'}</h2></div>
        {selectedTrace && <span className={`status status-${selectedTrace.status}`}>{selectedTrace.status}</span>}
      </div>
      {error && <div className="state-message error-message">{error}</div>}
      {loading && <div className="state-message">Loading trace…</div>}
      {!loading && !error && !selectedTrace && <div className="state-message">Select a run to inspect its execution.</div>}
      {!loading && selectedTrace && (
        <ReactFlow key={selectedTrace.id} nodes={nodes.map(node => ({ ...node, selected: node.id === selectedSpan?.id }))} edges={edges} nodeTypes={nodeTypes} onNodeClick={onNodeClick}
          nodesDraggable={false} nodesConnectable={false} elementsSelectable={true}
          deleteKeyCode={null}
          proOptions={proOptions} fitView minZoom={0.25} panOnScroll zoomOnScroll={false}
          defaultEdgeOptions={{ type: 'smoothstep' }}>
          <Background color="#dbe3ef" gap={22} />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={(node) => node.data.accent} />
        </ReactFlow>
      )}
      {selectedSpan && <span className="selection-note">Selected: {selectedSpan.name}</span>}
    </section>
  );
};

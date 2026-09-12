import { useTraceStore as useStore } from './store';
import { formatDuration } from './traceGraph';

export const TraceList = () => {
  const traces = useStore((state) => state.traces);
  const selectedTrace = useStore((state) => state.selectedTrace);
  const selectTrace = useStore((state) => state.selectTrace);
  const loadTraces = useStore((state) => state.loadTraces);
  return (
    <aside className="runs-panel">
      <div className="panel-heading"><div><p className="eyebrow">RUNS</p><h2>Recent traces</h2></div><span className="count-badge">{traces.length}</span></div>
      <button type="button" onClick={loadTraces}>Refresh runs</button>
      <div className="trace-list">
        {traces.map((trace) => <button key={trace.id} type="button" onClick={() => selectTrace(trace.id)} className={`trace-list-item ${selectedTrace?.id === trace.id ? 'active' : ''}`}>
          <span className="trace-list-name">{trace.name}</span><span className="trace-list-meta"><span className={`status status-${trace.status}`}>{trace.status}</span>{formatDuration(trace.duration_ms)}</span>
        </button>)}
        {!traces.length && <p className="empty-copy">No trace runs yet.</p>}
      </div>
    </aside>
  );
};

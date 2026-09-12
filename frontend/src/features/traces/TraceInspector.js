import { useTraceStore as useStore } from './store';
import { formatDuration } from './traceGraph';

const prettyValue = (value) => typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
const Field = ({ label, value }) => value !== null && value !== undefined && value !== '' ? <div className="inspector-field"><span>{label}</span><pre>{prettyValue(value)}</pre></div> : null;

export const TraceInspector = () => {
  const span = useStore((state) => state.selectedSpan);
  return <aside className="inspector-panel"><div className="panel-heading"><div><p className="eyebrow">INSPECTOR</p><h2>{span?.name || 'Select a span'}</h2></div></div>
    {!span ? <p className="empty-copy">Click a span in the execution graph to inspect its recorded data.</p> : <div className="inspector-content">
      <Field label="Span ID" value={span.id} /><Field label="Trace ID" value={span.trace_id} /><Field label="Parent span" value={span.parent_span_id} />
      <Field label="Started" value={span.started_at} /><Field label="Ended" value={span.ended_at} />
      <Field label="Type" value={span.span_type} /><Field label="Status" value={span.status} /><Field label="Latency" value={formatDuration(span.duration_ms)} />
      <Field label="Model" value={span.model} /><Field label="Tokens" value={span.total_tokens !== null && span.total_tokens !== undefined ? `${span.total_tokens} total · ${span.prompt_tokens || 0} prompt · ${span.completion_tokens || 0} completion` : null} />
      <Field label="Cost" value={span.cost !== null && span.cost !== undefined ? `$${span.cost}` : null} /><Field label="Input" value={span.input} /><Field label="Output" value={span.output} />
      <Field label="Metadata" value={Object.keys(span.metadata || {}).length ? span.metadata : null} /><Field label="Error" value={span.error} />
    </div>}
  </aside>;
};

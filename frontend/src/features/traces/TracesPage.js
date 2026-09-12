import { useEffect } from 'react';
import { TraceList } from './TraceList';
import { TraceViewer } from './TraceViewer';
import { TraceInspector } from './TraceInspector';
import { useTraceStore } from './store';

export function TracesPage() {
  const loadTraces = useTraceStore(state => state.loadTraces);
  useEffect(() => { loadTraces(); }, [loadTraces]);
  return <main className="trace-workspace"><TraceList /><TraceViewer /><TraceInspector /></main>;
}

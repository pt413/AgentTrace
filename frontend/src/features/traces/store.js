import { create } from "zustand";
import { getTrace, getTraces } from '../../shared/api';
import { traceToGraph } from './traceGraph';

let selectionRequest = 0;

export const useTraceStore = create((set, get) => ({
  traces: [],
  selectedTrace: null,
  selectedTraceId: null,
  selectedSpan: null,
  nodes: [],
  edges: [],
  loading: false,
  error: null,

  loadTraces: async () => {
    set({ loading: true, error: null });
    try {
      const traces = await getTraces();
      set({ traces, loading: false });
      if (traces.length && !get().selectedTraceId) {
        await get().selectTrace(traces[0].id);
      }
    } catch (error) {
      set({ loading: false, error: error.message });
    }
  },

  selectTrace: async (traceId) => {
    const requestId = ++selectionRequest;
    set({ loading: true, error: null, selectedTraceId: traceId, selectedSpan: null, selectedTrace: null, nodes: [], edges: [] });
    try {
      const selectedTrace = await getTrace(traceId);
      if (requestId !== selectionRequest) return;
      const { nodes, edges } = traceToGraph(selectedTrace.spans);
      set({ selectedTrace, nodes, edges, loading: false });
    } catch (error) {
      if (requestId !== selectionRequest) return;
      set({ loading: false, error: error.message });
    }
  },

  selectSpan: (spanId) => {
    const span = get().selectedTrace?.spans.find((item) => item.id === spanId) || null;
    set({ selectedSpan: span });
  },
}));

import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges } from 'reactflow';
import { getAgents, saveExternalAgent, deleteExternalAgent, runWorkflow } from '../../shared/api';
import { connectNodes, setConnections, toRunPayload } from './graph';

export const useWorkflowStore = create((set, get) => ({
  builtin: [], external: [], nodes: [], edges: [],
  name: 'Untitled workflow', inputText: '', inputMode: 'text', entryNodeId: '', maxSteps: 30,
  catalogLoading: false, catalogError: null, running: false, error: null, result: null, dialog: null,

  loadCatalog: async () => {
    if (get().catalogLoading) return;
    set({ catalogLoading: true, catalogError: null });
    try { set({ ...await getAgents(), catalogLoading: false }); }
    catch (error) { set({ catalogLoading: false, catalogError: error.message }); }
  },
  setField: (key, value) => { if (!get().running) set({ [key]: value }); },
  openDialog: dialog => { if (!get().running) set({ dialog }); },
  closeDialog: () => set({ dialog: null }),
  addAgent: (agentId, position) => {
    const state = get();
    if (state.running) return;
    const agent = [...state.builtin, ...state.external].find(item => item.id === agentId);
    if (!agent) return;
    const node = {
      id: crypto.randomUUID(), type: 'agent',
      position: position || { x: 80 + (state.nodes.length % 3) * 280, y: 80 + Math.floor(state.nodes.length / 3) * 190 },
      data: { agentId, name: agent.name, kind: agent.location ? 'external' : agent.id,
        accent: agent.accent || '#475569', description: agent.description,
        config: Object.fromEntries((agent.fields || []).map(field => [field.key, field.default ?? ''])) },
    };
    set({ nodes: [...state.nodes, node], result: null, error: null });
  },
  onNodesChange: changes => {
    if (get().running) return;
    const nodes = applyNodeChanges(changes, get().nodes);
    const ids = new Set(nodes.map(node => node.id));
    set({ nodes, edges: get().edges.filter(edge => ids.has(edge.source) && ids.has(edge.target)),
      entryNodeId: ids.has(get().entryNodeId) ? get().entryNodeId : '' });
  },
  onEdgesChange: changes => { if (!get().running) set({ edges: applyEdgeChanges(changes, get().edges), result: null }); },
  connect: ({ source, target }) => {
    if (!get().running) set({ edges: connectNodes(get().edges, get().nodes, source, target), result: null });
  },
  saveConnections: (id, incoming, outgoing) => {
    if (!get().running) set({ edges: setConnections(get().edges, get().nodes, id, incoming, outgoing), dialog: null, result: null });
  },
  updateNode: (id, name, config) => {
    if (!get().running) set({ nodes: get().nodes.map(node => node.id === id ? { ...node, data: { ...node.data, name, config } } : node), dialog: null, result: null });
  },
  removeNode: id => {
    if (get().running) return;
    set({ nodes: get().nodes.filter(node => node.id !== id), edges: get().edges.filter(edge => edge.source !== id && edge.target !== id),
      entryNodeId: get().entryNodeId === id ? '' : get().entryNodeId, result: null, dialog: null });
  },
  clear: () => { if (!get().running) set({ nodes: [], edges: [], entryNodeId: '', result: null, error: null, dialog: null }); },
  saveExternal: async (payload, id) => {
    const agent = await saveExternalAgent(payload, id);
    set({ external: id ? get().external.map(item => item.id === id ? agent : item) : [...get().external, agent], dialog: null });
  },
  removeExternal: async id => {
    if (get().nodes.some(node => node.data.agentId === id)) throw new Error('Remove this agent from the canvas before deleting its connection.');
    await deleteExternalAgent(id);
    set({ external: get().external.filter(agent => agent.id !== id), dialog: null });
  },
  run: async () => {
    const state = get();
    if (state.running || !state.nodes.length) return;
    set({ running: true, error: null, result: null });
    try {
      let input = state.inputText;
      if (state.inputMode === 'json') {
        try { input = JSON.parse(input); } catch (_) { throw new Error('Run input must be valid JSON, or switch to Text.'); }
      }
      const result = await runWorkflow(toRunPayload(state, input));
      set({ result, running: false });
    } catch (error) { set({ error: error.message, running: false }); }
  },
}));

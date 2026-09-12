export const edgeId = (source, target) => JSON.stringify([source, target]);

export function connectNodes(edges, nodes, source, target) {
  if (!nodes.some(node => node.id === source) || !nodes.some(node => node.id === target)) return edges;
  if (edges.some(edge => edge.source === source && edge.target === target)) return edges;
  return [...edges, { id: edgeId(source, target), source, target, type: 'smoothstep', markerEnd: { type: 'arrowclosed' } }];
}

export function setConnections(edges, nodes, nodeId, incoming, outgoing) {
  let result = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
  incoming.forEach(source => { result = connectNodes(result, nodes, source, nodeId); });
  outgoing.forEach(target => { result = connectNodes(result, nodes, nodeId, target); });
  return result;
}

export function toRunPayload(state, input) {
  return {
    name: state.name,
    nodes: state.nodes.map(node => ({ id: node.id, agent_id: node.data.agentId, name: node.data.name, config: node.data.config })),
    edges: state.edges.map(({ source, target }) => ({ source, target })),
    input, max_steps: state.maxSteps, entry_node_id: state.entryNodeId || null,
  };
}

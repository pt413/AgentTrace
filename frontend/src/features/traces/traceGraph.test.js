import { traceToGraph } from './traceGraph';

test('converts parent span relationships into positioned nodes and edges', () => {
  const graph = traceToGraph([{ id: 'agent', name: 'Agent', span_type: 'agent' }, { id: 'tool', name: 'Tool', span_type: 'tool', parent_span_id: 'agent', duration_ms: 40 }]);
  expect(graph.nodes).toHaveLength(2);
  expect(graph.nodes[1].position.x).toBeGreaterThan(graph.nodes[0].position.x);
  expect(graph.nodes[1].data.durationLabel).toBe('40 ms');
  expect(graph.edges).toEqual(expect.arrayContaining([expect.objectContaining({ source: 'agent', target: 'tool' })]));
});

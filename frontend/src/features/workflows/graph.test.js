import { connectNodes, setConnections, toRunPayload } from './graph';

const nodes = ['a', 'b', 'c'].map(id => ({ id, position: { x: 0, y: 0 }, data: { agentId: 'template', name: id, config: { template: '{{input}}' } } }));

test('manual connections reject duplicates and missing agents, while allowing cycles', () => {
  const edges = connectNodes([], nodes, 'a', 'b');
  expect(connectNodes(edges, nodes, 'a', 'b')).toHaveLength(1);
  expect(connectNodes(edges, nodes, 'a', 'missing')).toHaveLength(1);
  expect(connectNodes(edges, nodes, 'b', 'a')).toHaveLength(2);
});

test('connection dialog replaces both directions and keeps unrelated arrows', () => {
  let edges = connectNodes([], nodes, 'a', 'b');
  edges = connectNodes(edges, nodes, 'b', 'c');
  edges = connectNodes(edges, nodes, 'c', 'a');
  const result = setConnections(edges, nodes, 'b', ['c'], ['a']);
  expect(result.map(({ source, target }) => [source, target])).toEqual([['c', 'a'], ['c', 'b'], ['b', 'a']]);
});

test('execution payload excludes React Flow internals and includes agent settings', () => {
  const result = toRunPayload({ name: 'Run', nodes, edges: connectNodes([], nodes, 'a', 'b'), maxSteps: 4, entryNodeId: 'a' }, { text: 'hello' });
  expect(result.nodes[0]).toEqual({ id: 'a', agent_id: 'template', name: 'a', config: { template: '{{input}}' } });
  expect(result.edges).toEqual([{ source: 'a', target: 'b' }]);
  expect(result.entry_node_id).toBe('a');
  expect(result.input).toEqual({ text: 'hello' });
});

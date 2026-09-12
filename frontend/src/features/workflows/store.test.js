import { useWorkflowStore } from './store';
import { runWorkflow } from '../../shared/api';

jest.mock('../../shared/api', () => ({ getAgents: jest.fn(), saveExternalAgent: jest.fn(), deleteExternalAgent: jest.fn(), runWorkflow: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  useWorkflowStore.setState({ nodes: [], edges: [], running: false, result: null, error: null, inputText: '', inputMode: 'text', entryNodeId: '', maxSteps: 30 });
});

test('workflow starts empty and cannot execute without agents', async () => {
  await useWorkflowStore.getState().run();
  expect(useWorkflowStore.getState().nodes).toEqual([]);
  expect(runWorkflow).not.toHaveBeenCalled();
});

test('removing a node removes its arrows and resets its entry selection', () => {
  useWorkflowStore.setState({ nodes: [{ id: 'a' }, { id: 'b' }], edges: [{ id: 'ab', source: 'a', target: 'b' }], entryNodeId: 'a' });
  useWorkflowStore.getState().removeNode('a');
  expect(useWorkflowStore.getState().edges).toEqual([]);
  expect(useWorkflowStore.getState().entryNodeId).toBe('');
});

test('invalid JSON is reported without executing any agent', async () => {
  useWorkflowStore.setState({ nodes: [{ id: 'a' }], inputMode: 'json', inputText: '{broken' });
  await useWorkflowStore.getState().run();
  expect(runWorkflow).not.toHaveBeenCalled();
  expect(useWorkflowStore.getState().error).toMatch('valid JSON');
});

test('running locks edits and keeps the execution result', async () => {
  const result = { trace: { id: 'trace', status: 'completed' }, outputs: { a: 'answer' }, steps: 1 };
  let finish;
  runWorkflow.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  useWorkflowStore.setState({ nodes: [{ id: 'a', data: { name: 'A', agentId: 'template', config: {} } }] });
  const pending = useWorkflowStore.getState().run();
  useWorkflowStore.getState().removeNode('a');
  expect(useWorkflowStore.getState().nodes).toHaveLength(1);
  finish(result);
  await pending;
  expect(useWorkflowStore.getState().result).toEqual(result);
  expect(useWorkflowStore.getState().running).toBe(false);
});

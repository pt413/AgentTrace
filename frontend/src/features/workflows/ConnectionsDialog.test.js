import { fireEvent, render, screen, within } from '@testing-library/react';
import { ConnectionsDialog } from './ConnectionsDialog';
import { useWorkflowStore } from './store';

test('choosing a destination in the popup creates a canvas connection', () => {
  const node = { id: 'a', data: { name: 'First agent' } };
  useWorkflowStore.setState({ nodes: [node, { id: 'b', data: { name: 'Second agent' } }], edges: [], running: false });
  render(<ConnectionsDialog node={node} />);
  const outgoing = screen.getByRole('group', { name: 'Sends to' });
  fireEvent.click(within(outgoing).getByRole('checkbox', { name: /Second agent/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Save connections' }));
  expect(useWorkflowStore.getState().edges).toEqual([expect.objectContaining({ source: 'a', target: 'b' })]);
});

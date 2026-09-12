import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ExternalAgentDialog } from './ExternalAgentDialog';
import { saveExternalAgent } from '../../shared/api';
import { useWorkflowStore } from '../workflows/store';

jest.mock('../../shared/api', () => ({ getAgents: jest.fn(), saveExternalAgent: jest.fn(), deleteExternalAgent: jest.fn(), runWorkflow: jest.fn() }));

test('registers an external endpoint in the library without invoking it', async () => {
  useWorkflowStore.setState({ external: [] });
  saveExternalAgent.mockResolvedValue({ id: 'external-1', name: 'My local agent', endpoint: 'http://localhost:9000/invoke', location: 'local' });
  render(<ExternalAgentDialog location="local" />);
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'My local agent' } });
  fireEvent.change(screen.getByLabelText('Endpoint URL'), { target: { value: 'http://localhost:9000/invoke' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save connection' }));
  await waitFor(() => expect(saveExternalAgent).toHaveBeenCalledWith(expect.objectContaining({ name: 'My local agent', location: 'local', protocol: 'agent_json' }), undefined));
  await waitFor(() => expect(useWorkflowStore.getState().external).toHaveLength(1));
});

import { useState } from 'react';
import { Dialog } from '../../shared/Dialog';
import { useWorkflowStore } from './store';

export function ConnectionsDialog({ node }) {
  const { nodes, edges, saveConnections, closeDialog } = useWorkflowStore();
  const [incoming, setIncoming] = useState(edges.filter(edge => edge.target === node.id).map(edge => edge.source));
  const [outgoing, setOutgoing] = useState(edges.filter(edge => edge.source === node.id).map(edge => edge.target));
  const toggle = (list, setList, id) => setList(list.includes(id) ? list.filter(item => item !== id) : [...list, id]);
  const options = (list, setList) => nodes.filter(item => item.id !== node.id).map(item => <label className="connection-option" key={item.id}>
    <input type="checkbox" checked={list.includes(item.id)} onChange={() => toggle(list, setList, item.id)} />
    <span><strong>{item.data.name}</strong><small>{item.id}</small></span>
  </label>);
  const selfLoop = incoming.includes(node.id) || outgoing.includes(node.id);
  return <Dialog title={`Connections: ${node.data.name}`} onClose={closeDialog}>
    <form onSubmit={event => { event.preventDefault(); saveConnections(node.id, incoming, outgoing); }}>
      <p className="helper">Select the connected agents below. Saving updates the arrows on the canvas.</p>
      <div className="connection-columns"><fieldset><legend>Receives from</legend>{options(incoming, setIncoming)}</fieldset><fieldset><legend>Sends to</legend>{options(outgoing, setOutgoing)}</fieldset></div>
      {nodes.length === 1 && <p className="helper">Add another agent to connect it here.</p>}
      <label className="connection-option"><input type="checkbox" checked={selfLoop} onChange={() => { setIncoming(incoming.filter(id => id !== node.id)); setOutgoing(selfLoop ? outgoing.filter(id => id !== node.id) : [...outgoing, node.id]); }} />Loop output back to this agent</label>
      <p className="helper">Each incoming connection triggers a separate invocation. Loops stop at the run step limit; choose an entry agent for a graph with no starting point.</p>
      <div className="dialog-actions"><button className="primary-button" type="submit">Save connections</button></div>
    </form>
  </Dialog>;
}

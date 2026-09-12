import { useState } from 'react';
import { Dialog } from '../../shared/Dialog';
import { useWorkflowStore } from './store';

export function NodeSettingsDialog({ node }) {
  const { builtin, external, updateNode, removeNode, closeDialog, openDialog } = useWorkflowStore();
  const definition = [...builtin, ...external].find(agent => agent.id === node.data.agentId);
  const [name, setName] = useState(node.data.name);
  const [config, setConfig] = useState(node.data.config);
  return <Dialog title="Agent settings" onClose={closeDialog}>
    <form className="agent-form" onSubmit={event => { event.preventDefault(); updateNode(node.id, name.trim(), config); }}>
      <label>Instance name<input required maxLength={100} value={name} onChange={event => setName(event.target.value)} /></label>
      {(definition?.fields || []).map(field => <label key={field.key}>{field.label}
        {field.type === 'select' ? <select value={config[field.key]} onChange={event => setConfig({ ...config, [field.key]: event.target.value })}>{field.options.map(option => <option key={option}>{option}</option>)}</select>
          : field.type === 'textarea' ? <textarea rows={4} required={field.required} value={config[field.key]} onChange={event => setConfig({ ...config, [field.key]: event.target.value })} />
          : <input type={field.type} required={field.required} placeholder={field.placeholder} value={config[field.key]} onChange={event => setConfig({ ...config, [field.key]: event.target.value })} />}
      </label>)}
      {node.data.kind === 'external' && <div className="contract-note"><p>{definition?.endpoint || 'External connection no longer exists. Remove this instance and reconnect the agent.'}</p>{definition && <button type="button" onClick={() => openDialog({ type: 'external', agent: definition })}>Edit external connection</button>}</div>}
      {node.data.kind === 'llm' && <p className="helper">Use a running chat completions API and its model name. If authentication is needed, set the API key in the backend environment and enter only its variable name here.</p>}
      <p className="helper">Node ID: <code>{node.id}</code></p>
      <div className="dialog-actions"><button className="danger-button" type="button" onClick={() => removeNode(node.id)}>Remove from workflow</button><button className="primary-button" type="submit" disabled={!name.trim()}>Save settings</button></div>
    </form>
  </Dialog>;
}

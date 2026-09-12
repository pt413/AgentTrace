import { useState } from 'react';
import { WorkflowPage } from './features/workflows/WorkflowPage';
import { TracesPage } from './features/traces/TracesPage';
import { useTraceStore } from './features/traces/store';
import { useWorkflowStore } from './features/workflows/store';
import './features/workflows/workflows.css';

function App() {
  const [page, setPage] = useState('workflow');
  const catalogLoading = useWorkflowStore(state => state.catalogLoading);
  const catalogError = useWorkflowStore(state => state.catalogError);
  const viewTrace = id => { useTraceStore.getState().selectTrace(id); setPage('traces'); };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">BUILD / CONNECT / TRACE</p>
          <h1>AgentTrace</h1>
        </div>
        <nav aria-label="Main navigation"><button type="button" aria-current={page === 'workflow' ? 'page' : undefined} onClick={() => setPage('workflow')}>Workflow</button><button type="button" aria-current={page === 'traces' ? 'page' : undefined} onClick={() => setPage('traces')}>Execution traces</button></nav>
        <span className={`connection-status ${catalogError ? 'offline' : ''}`}>{catalogLoading ? 'Connecting...' : catalogError ? 'Backend unavailable' : 'Backend connected'}</span>
      </header>
      {page === 'workflow' ? <WorkflowPage onViewTrace={viewTrace} /> : <TracesPage />}
    </div>
  );
}

export default App;

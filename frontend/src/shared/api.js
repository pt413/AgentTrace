const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options, headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (_) {
    throw new Error('Cannot reach AgentTrace. Check that the backend is running, then retry.');
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const detail = (await response.json()).detail;
      message = Array.isArray(detail) ? detail.map(item => `${item.loc.join('.')}: ${item.msg}`).join('; ') : detail || message;
    } catch (_) { /* use HTTP status when the server has no JSON error */ }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

export const getTraces = () => request('/api/v1/traces');
export const getTrace = (traceId) => request(`/api/v1/traces/${encodeURIComponent(traceId)}`);
export const getAgents = () => request('/api/v1/agents');
export const saveExternalAgent = (agent, id) => request(`/api/v1/agents/external${id ? `/${encodeURIComponent(id)}` : ''}`, {
  method: id ? 'PUT' : 'POST', body: JSON.stringify(agent),
});
export const deleteExternalAgent = id => request(`/api/v1/agents/external/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const runWorkflow = payload => request('/api/v1/workflows/run', { method: 'POST', body: JSON.stringify(payload) });

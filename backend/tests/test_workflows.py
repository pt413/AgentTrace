import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

import pytest
from fastapi.testclient import TestClient

from app.agents.http_client import AgentExecutionError, AgentHttpClient
from app.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.fixture
def client(app):
    return TestClient(app)


def node(id, agent_id="template", config=None):
    return {"id": id, "agent_id": agent_id, "name": id, "config": config or {}}


def payload(nodes, edges=None, **extra):
    return {"name": "Test workflow", "nodes": nodes, "edges": edges or [], "input": "hello", **extra}


def test_empty_default_and_builtin_catalog(client):
    assert client.get('/api/v1/traces').json() == []
    catalog = client.get('/api/v1/agents').json()
    assert {item['id'] for item in catalog['builtin']} == {'llm', 'template', 'json_extract', 'text_transform'}
    assert catalog['external'] == []


def test_sequence_passes_outputs_and_records_trace(client):
    body = payload([node('a', config={'template': '  {{input}}  '}), node('b', 'text_transform', {'operation': 'trim'})], [{'source': 'a', 'target': 'b'}])
    response = client.post('/api/v1/workflows/run', json=body)
    assert response.status_code == 201
    result = response.json()
    assert result['outputs'] == {'b': 'hello'}
    assert result['steps'] == 2
    trace = client.get('/api/v1/traces/' + result['trace']['id']).json()
    assert trace['status'] == 'completed'
    root, first, second = trace['spans']
    assert first['input'] == 'hello'
    assert second['input'] == '  hello  '
    assert second['parent_span_id'] == first['id']
    assert first['parent_span_id'] == root['id']
    assert all(span['started_at'] and span['ended_at'] and span['duration_ms'] >= 0 for span in trace['spans'])


def test_branches_and_separate_deliveries(client):
    nodes = [node('a'), node('b', 'text_transform', {'operation': 'uppercase'}), node('c'), node('d')]
    edges = [{'source': a, 'target': b} for a, b in [('a', 'b'), ('a', 'c'), ('b', 'd'), ('c', 'd')]]
    result = client.post('/api/v1/workflows/run', json=payload(nodes, edges)).json()
    assert result['steps'] == 5
    invocations = [span for span in result['trace']['spans'] if span['name'] == 'd']
    assert [span['input'] for span in invocations] == ['HELLO', 'hello']


def test_cycle_requires_entry_and_stops_at_step_limit(client):
    body = payload([node('a')], [{'source': 'a', 'target': 'a'}], max_steps=3)
    assert client.post('/api/v1/workflows/run', json=body).status_code == 422
    body['entry_node_id'] = 'a'
    response = client.post('/api/v1/workflows/run', json=body)
    assert response.status_code == 201
    result = response.json()
    assert result['steps'] == 3
    assert result['trace']['status'] == 'failed'
    assert 'step limit' in result['trace']['spans'][0]['error']['message']
    assert len({span['id'] for span in result['trace']['spans']}) == 4


def test_failure_stops_downstream_and_is_inspectable(client):
    body = payload([node('a', 'json_extract', {'path': 'missing'}), node('b')], [{'source': 'a', 'target': 'b'}])
    result = client.post('/api/v1/workflows/run', json=body).json()
    assert result['trace']['status'] == 'failed'
    assert result['steps'] == 1
    assert result['trace']['spans'][1]['error']['message']
    assert result['outputs'] == {}


def test_json_array_extraction(client):
    response = client.post('/api/v1/workflows/run', json=payload([node('a', 'json_extract', {'path': 'items.0.text'})], input={'items': [{'text': 'found'}]}))
    assert response.json()['outputs'] == {'a': 'found'}


@pytest.mark.parametrize('body', [
    payload([]), payload([node('a'), node('a')]),
    payload([node('a')], [{'source': 'a', 'target': 'missing'}]),
    payload([node('a')], [{'source': 'a', 'target': 'a'}, {'source': 'a', 'target': 'a'}]),
    payload([node('a')], entry_node_id='missing'), payload([node('a')], max_steps=101),
    payload([node('a', 'missing-agent')]), payload([node('a', 'llm')]),
])
def test_invalid_workflows_return_422_without_execution(client, body):
    assert client.post('/api/v1/workflows/run', json=body).status_code == 422
    assert client.get('/api/v1/traces').json() == []


def external_payload(**extra):
    return {'name': 'My agent', 'location': 'local', 'endpoint': 'http://localhost:9999/invoke', **extra}


def test_external_registration_update_delete(client):
    created = client.post('/api/v1/agents/external', json=external_payload())
    assert created.status_code == 201
    agent_id = created.json()['id']
    assert client.get('/api/v1/agents').json()['external'][0]['id'] == agent_id
    path = '/api/v1/agents/external/' + agent_id
    assert client.put(path, json=external_payload(name='Updated')).json()['name'] == 'Updated'
    assert client.delete(path).status_code == 204
    assert client.delete(path).status_code == 404
    assert client.put(path, json=external_payload()).status_code == 404


@pytest.mark.parametrize('values', [
    {'endpoint': 'file:///tmp/agent'}, {'endpoint': 'https://key:secret@example.com/invoke'},
    {'endpoint': 'https://example.com/invoke?token=secret'}, {'location': 'online'},
    {'protocol': 'chat_completions'}, {'token_env': 'raw-secret-123'},
])
def test_invalid_external_settings(client, values):
    assert client.post('/api/v1/agents/external', json=external_payload(**values)).status_code == 422


def test_llm_passes_answer_and_token_usage(client, app):
    calls = []
    def post(endpoint, body, token_env, timeout):
        calls.append(body)
        return {'choices': [{'message': {'content': 'model answer'}}], 'usage': {'prompt_tokens': 8, 'completion_tokens': 2, 'total_tokens': 10}}
    app.state.workflow_service.runtime.http.post = post
    llm = node('llm', 'llm', {'endpoint': 'http://localhost:11434/v1/chat/completions', 'model': 'local-model'})
    body = payload([llm, node('next', config={'template': 'Result: {{input}}'})], [{'source': 'llm', 'target': 'next'}])
    result = client.post('/api/v1/workflows/run', json=body).json()
    assert result['outputs'] == {'next': 'Result: model answer'}
    assert calls[0]['messages'][-1]['content'] == 'hello'
    assert result['trace']['spans'][1]['total_tokens'] == 10


def test_missing_secret_is_recorded_without_exposing_secret(client, monkeypatch):
    monkeypatch.delenv('AGENTTRACE_TEST_TOKEN', raising=False)
    llm = node('a', 'llm', {'endpoint': 'http://localhost:11434/v1/chat/completions', 'model': 'local', 'token_env': 'AGENTTRACE_TEST_TOKEN'})
    result = client.post('/api/v1/workflows/run', json=payload([llm])).json()
    assert result['trace']['status'] == 'failed'
    assert 'Set AGENTTRACE_TEST_TOKEN' in result['trace']['spans'][1]['error']['message']


def test_external_http_round_trip(client):
    captured = []
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
            captured.append(body)
            response = json.dumps({'output': body['input'] + ' from external'}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(response)

        def log_message(self, *args):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    worker = Thread(target=server.serve_forever, daemon=True)
    worker.start()
    try:
        agent = client.post('/api/v1/agents/external', json=external_payload(endpoint=f'http://127.0.0.1:{server.server_port}/invoke')).json()
        result = client.post('/api/v1/workflows/run', json=payload([node('external', agent['id'])])).json()
        assert result['outputs'] == {'external': 'hello from external'}
        assert captured[0]['context']['trace_id'] == result['trace']['id']
    finally:
        server.shutdown()
        server.server_close()
        worker.join()


def test_http_transport_errors_are_safe(monkeypatch):
    from urllib.error import HTTPError
    class FailingOpener:
        def open(self, *args, **kwargs):
            raise HTTPError('http://secret.example', 401, 'private response', {}, None)
    monkeypatch.setattr('app.agents.http_client.build_opener', lambda *args: FailingOpener())
    with pytest.raises(AgentExecutionError, match='HTTP 401') as error:
        AgentHttpClient().post('http://localhost:9999/invoke', {}, '', 2)
    assert 'private response' not in str(error.value)

from fastapi.testclient import TestClient

from app.main import create_app


def make_client() -> TestClient:
    return TestClient(create_app(seed_demo=False))


def trace_payload() -> dict:
    return {"id": "trace-test-1", "name": "Test agent run", "status": "completed", "duration_ms": 125.5, "spans": [{"id": "root", "name": "Agent", "span_type": "agent", "duration_ms": 125.5}, {"id": "child", "parent_span_id": "root", "name": "Call model", "span_type": "llm", "model": "test-model", "total_tokens": 42}]}


def test_create_trace_preserves_parent_child_spans() -> None:
    response = make_client().post("/api/v1/traces", json=trace_payload())
    assert response.status_code == 201
    trace = response.json()
    assert trace["id"] == "trace-test-1"
    assert trace["span_count"] == 2
    assert trace["spans"][1]["parent_span_id"] == "root"
    assert all(span["trace_id"] == "trace-test-1" for span in trace["spans"])


def test_list_and_get_trace() -> None:
    client = make_client()
    client.post("/api/v1/traces", json=trace_payload())
    listing = client.get("/api/v1/traces")
    assert listing.status_code == 200
    assert listing.json()[0]["span_count"] == 2
    detail = client.get("/api/v1/traces/trace-test-1")
    assert detail.status_code == 200
    assert detail.json()["spans"][1]["name"] == "Call model"


def test_unknown_trace_returns_404() -> None:
    response = make_client().get("/api/v1/traces/missing")
    assert response.status_code == 404
    assert response.json()["detail"] == "Trace not found"

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_find_path_endpoint():
    response = client.post("/find-path/", json={
        "nodes": ["A", "B"],
        "edges": [{"from_node": "A", "to_node": "B", "distance": 10}],
        "start": "A",
        "end": "B"
    })
    assert response.status_code == 200
    assert response.json()["optimal_path"] == ["A", "B"]
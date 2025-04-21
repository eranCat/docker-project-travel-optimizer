import pytest
from fastapi.testclient import TestClient
from main import app  # adjust this import if your app is located elsewhere

client = TestClient(app)


def test_generate_paths_success():
    payload = {
        "interests": "yoga, drag shows, vegan food",
        "location": "tel aviv",
        "radius_km": 2,
        "num_routes": 3,
        "num_pois": 5
    }

    response = client.post("/routes/generate-paths", json=payload)

    # Make sure the request succeeded
    assert response.status_code == 200

    # Check the structure of the response
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3  # because num_routes = 3
    for route in data:
        assert isinstance(route, list)
        assert 1 <= len(route) <= 5  # max 5 POIs per route
        for poi in route:
            assert "name" in poi
            assert "latitude" in poi
            assert "longitude" in poi
            assert "address" in poi

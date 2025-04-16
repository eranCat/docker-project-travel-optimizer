import pytest

@pytest.mark.integration
def test_debug_llm_tags(client):
    response = client.post("/api/match-pois-overpass", json={
        "interests": "shopping, fashion, yoga",
        "location": "Tel Aviv",
        "radius_km": 10,
        "num_results": 5,
        "debug": True
    })
    assert response.status_code == 200
    assert isinstance(response.json(), list)
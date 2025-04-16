import pytest

@pytest.mark.integration
def test_match_pois_overpass_valid_input(client):
    response = client.post("/api/match-pois-overpass", json={
        "interests": "food, sports",
        "location": "Tel Aviv",
        "radius_km": 10,
        "num_results": 5,
        "debug": False
    })
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 5
    for poi in data:
        assert "name" in poi
        assert "latitude" in poi
        assert "longitude" in poi
        assert "categories" in poi

def test_match_pois_invalid_location(client):
    response = client.post("/api/match-pois-overpass", json={
        "interests": "shopping",
        "location": "sguojnason",
        "radius_km": 10,
        "num_results": 3,
        "debug": False
    })
    assert response.status_code in [422, 500]
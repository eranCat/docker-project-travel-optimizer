import requests
import time


# Optional: wait for maps_service readiness
def wait_for_maps_service(url: str, timeout: int = 30):
    print(f"Waiting for {url}...")
    for _ in range(timeout):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print("✅ Maps service is up")
                return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError("❌ Timeout waiting for maps_service")


def test_maps_geocode():
    wait_for_maps_service("http://maps-service:8000/health")
    url = "http://maps-service:8000/geocode/?location=Tel+Aviv"
    response = requests.get(url)
    assert response.status_code == 200
    lat, lon = response.json()
    assert isinstance(lat, float) and isinstance(lon, float)
    print(f"✅ Geocode returned: ({lat}, {lon})")


def test_maps_pois():
    url = "http://maps-service:8000/pois/"
    payload = {
        "location": "Tel Aviv",
        "interests": "museum, art, culture",
        "radius_km": 3,
        "num_routes": 1,
        "num_pois": 3,
        "travel_mode": "walking",
    }
    response = requests.post(url, json=payload)
    assert (
        response.status_code == 200
    ), f"Status: {response.status_code}, Body: {response.text}"
    pois = response.json()
    assert isinstance(pois, list)
    assert all("latitude" in p and "longitude" in p for p in pois)
    print(f"✅ Found {len(pois)} POIs")


def test_maps_routes():
    url = "http://maps-service:8000/routes/optimized"
    payload = {
        "request": {
            "location": "Tel Aviv",
            "interests": "museum, art",
            "radius_km": 3,
            "num_routes": 1,
            "num_pois": 2,
            "travel_mode": "walking",
        },
        "pois": [
            {
                "id": "1",
                "name": "Museum A",
                "description": "Art museum",
                "latitude": 32.0853,
                "longitude": 34.7818,
                "address": "Tel Aviv",
                "categories": ["museum"],
            },
            {
                "id": "2",
                "name": "Gallery B",
                "description": "Modern gallery",
                "latitude": 32.0805,
                "longitude": 34.7800,
                "address": "Tel Aviv",
                "categories": ["gallery"],
            },
        ],
    }
    response = requests.post(url, json=payload)
    assert (
        response.status_code == 200
    ), f"Status: {response.status_code}, Body: {response.text}"
    result = response.json()
    assert "routes" in result and isinstance(result["routes"], list)
    print(f"✅ Optimized routes generated: {len(result['routes'])}")

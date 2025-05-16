import requests

BASE_URL = "http://backend:8000"


def test_route_progress_sse():
    params = {
        "location": "Tel Aviv",
        "interests": "food",
        "radius_km": 5,
        "num_routes": 1,
        "num_pois": 3,
        "travel_mode": "walking",
    }

    with requests.get(
        f"{BASE_URL}/route-progress", params=params, stream=True
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"].startswith("text/event-stream")

        stages = []
        route_id = None
        error_text = None
        event_type = None

        for line in response.iter_lines(decode_unicode=True):
            if not line:
                continue

            if line.startswith("event:"):
                event_type = line.replace("event:", "").strip()
            elif line.startswith("data:"):
                data = line.replace("data:", "").strip()
                print(f"📡 Event: {event_type} | Data: {data}")

                if event_type == "stage":
                    stages.append(data)
                elif event_type == "complete":
                    route_id = data
                    break
                elif event_type == "error":
                    error_text = data
                    break

        if error_text:
            print("❌ Error from SSE:", error_text)
            assert False, f"SSE error: {error_text}"

        assert route_id is not None, "No 'complete' event received"
        print("✅ Completed with route_id:", route_id)

import requests
import time

BASE_URL = "http://backend:8000"


def wait_for_backend():
    url = f"{BASE_URL}/health"
    for _ in range(30):
        try:
            r = requests.get(url)
            if r.status_code == 200:
                print("✅ Backend service is up")
                return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError("❌ Timeout waiting for backend")


def test_autocomplete():
    url = f"{BASE_URL}/autocomplete?q=tel"
    res = requests.get(url)
    assert res.status_code == 200
    results = res.json()
    assert isinstance(results, list)
    print(f"✅ Autocomplete returned {len(results)} results")
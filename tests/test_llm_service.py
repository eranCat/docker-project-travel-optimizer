import requests
import time


# Optional: retry logic to wait until llm_service is ready
def wait_for_service(url: str, timeout: int = 30):
    print(f"Waiting for {url}...")
    for _ in range(timeout):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print("✅ Service is up")
                return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError("❌ Timeout waiting for llm_service")


def test_generate_tags_from_llm():
    # Wait for service to be ready (optional but helpful)
    wait_for_service(LLM_BASE_URL+"/docs")

    url = LLM_BASE_URL+"/generate-tags"
    payload = {
        "interests": "music, art, yoga",
        "valid_tags": {
            "tourism": ["museum", "gallery"],
            "leisure": ["park", "fitness_centre"],
        },
    }

    response = requests.post(url, json=payload)

    assert (
        response.status_code == 200
    ), f"Unexpected status code: {response.status_code}\n{response.text}"
    tags = response.json()

    assert isinstance(tags, list), "Expected response to be a list"
    assert all(
        "key" in tag and "value" in tag for tag in tags
    ), "Each tag must contain 'key' and 'value'"
    print("✅ /generate-tags passed")

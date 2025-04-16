import time
import requests

def wait_for_ollama_ready(timeout: int = 60):
    print("⏳ Waiting for Ollama to be ready...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get("http://ollama:11434")
            if r.status_code == 200:
                print("✅ Ollama is ready.")
                return
        except Exception:
            pass
        time.sleep(1)
    raise RuntimeError("❌ Ollama did not become ready in time.")

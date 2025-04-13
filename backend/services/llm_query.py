# backend/services/llm_query.py

import requests

OLLAMA_URL = "http://localhost:11434/api/generate"

def query_llm(prompt: str, model: str = "mistral") -> str:
    try:
        response = requests.post(OLLAMA_URL, json={
            "model": model,
            "prompt": prompt,
            "stream": False
        })
        response.raise_for_status()
        return response.json()["response"].strip()
    except Exception as e:
        print("LLM request failed:", e)
        return ""

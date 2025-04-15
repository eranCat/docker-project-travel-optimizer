# backend/tests/test_llm_poi_service.py
import pytest
from services.llm.llm_poi_service import get_pois_from_ollama, build_poi_prompt
from schemas.route import POI
import requests
from unittest.mock import patch

def test_build_poi_prompt():
    prompt = build_poi_prompt("yoga, food", "Tel Aviv")
    assert "Tel Aviv" in prompt
    assert "yoga" in prompt

@patch("backend.services.llm.llm_poi_service.requests.post")
def test_get_pois_from_ollama_success(mock_post):
    mock_response = {
        "response": """
        [
            {
                "name": "Test Cafe",
                "description": "Great spot",
                "address": "123 Street",
                "latitude": 32.1,
                "longitude": 34.8,
                "category": "food"
            }
        ]
        """
    }
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = mock_response

    pois = get_pois_from_ollama("coffee", "Tel Aviv")
    assert isinstance(pois, list)
    assert len(pois) == 1
    assert isinstance(pois[0], POI)
    assert pois[0].name == "Test Cafe"

@patch("backend.services.llm.llm_poi_service.requests.post")
def test_get_pois_from_ollama_invalid_json(mock_post):
    mock_response = {
        "response": "Sorry, I don't know"
    }
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = mock_response

    with pytest.raises(ValueError):
        get_pois_from_ollama("whatever", "nowhere")

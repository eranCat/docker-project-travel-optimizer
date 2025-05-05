import unittest
from unittest.mock import patch, MagicMock
from services.llm import groq_client


class TestGroqClient(unittest.TestCase):
    @patch("services.llm.groq_client.client.chat.completions.create")
    def test_call_groq_for_tags(self, mock_create):
        mock_create.return_value.choices = [
            MagicMock(
                message=MagicMock(content='[{"key": "tourism", "value": "museum"}]')
            )
        ]
        valid_tags = {"tourism": ["museum"]}
        result = groq_client.call_groq_for_tags("museum", valid_tags)
        self.assertEqual(result[0]["key"], "tourism")

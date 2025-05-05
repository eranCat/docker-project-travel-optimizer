import unittest
from unittest.mock import patch, MagicMock
from services.maps import geocoding

class TestGeocoding(unittest.TestCase):
    @patch("services.maps.geocoding.requests.get")
    def test_geocode_location_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.json.return_value = [{"lat": "32.0853", "lon": "34.7818"}]
        mock_get.return_value = mock_response

        lat, lon = geocoding.geocode_location("Tel Aviv")
        self.assertEqual(lat, 32.0853)
        self.assertEqual(lon, 34.7818)

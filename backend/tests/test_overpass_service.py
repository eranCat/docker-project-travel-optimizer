import unittest
from unittest.mock import patch
from services.maps import overpass_service
from models.route_request import RouteGenerationRequest
from models.overpass import OverpassTag


class TestOverpassService(unittest.TestCase):
    @patch("services.maps.overpass_service.geocode_location")
    @patch("services.maps.overpass_service.requests.post")
    def test_get_pois_from_overpass(self, mock_post, mock_geocode):
        mock_geocode.return_value = (32.0853, 34.7818)
        mock_post.return_value.json.return_value = {"elements": []}

        request = RouteGenerationRequest(
            interests="museum",
            location="Tel Aviv",
            radius_km=2,
            num_routes=1,
            num_pois=3,
        )
        tags = [OverpassTag(key="tourism", value="museum")]

        result = overpass_service.get_pois_from_overpass(request, tags)
        self.assertIsInstance(result, list)

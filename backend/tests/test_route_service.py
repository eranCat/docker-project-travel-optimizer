import unittest
from unittest.mock import patch
from services.maps import route_service


class TestRouteService(unittest.TestCase):
    @patch("services.maps.route_service.ors_client.directions")
    def test_get_real_route(self, mock_directions):
        mock_directions.return_value = {
            "features": [
                {"geometry": {"coordinates": [[34.78, 32.08], [34.79, 32.09]]}}
            ]
        }
        route = route_service.get_real_route([(34.78, 32.08), (34.79, 32.09)])
        self.assertEqual(len(route), 2)

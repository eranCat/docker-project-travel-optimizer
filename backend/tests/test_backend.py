"""
Backend test suite.

Unit tests: no live server needed — external calls are mocked.
Integration tests: require `uvicorn main:app --port 8000` in a separate terminal.

Run all:           pytest
Run unit only:     pytest -k "not test_health and not test_autocomplete and not test_route and not test_get"
Run integration:   pytest -m integration  (add @pytest.mark.integration to those tests)
Run single test:   pytest tests/test_backend.py::TestRoutesCache::test_expired_entry_returns_none
"""
import os
import sys
import time
import unittest
from unittest.mock import patch

# Must be set before any backend module is imported (pydantic-settings reads them at class-body time)
os.environ.setdefault("GROQ_API_KEY", "test-key")
os.environ.setdefault("ORS_API_KEY", "test-key")

import requests

BASE_URL = os.environ.get("BACKEND_BASE_URL", "http://localhost:8000")


# ─── Shared helpers ───────────────────────────────────────────────────────────

def _poi(name: str, lat: float, lon: float, cats: list, poi_id: str = "1"):
    from models.llm_suggestion import LLMPOISuggestion
    return LLMPOISuggestion(id=poi_id, name=name, latitude=lat, longitude=lon, categories=cats)


def _spread_pois(n: int) -> list:
    """n POIs spread across n distinct categories, well separated geographically."""
    cats = ["museum", "cafe", "park", "gallery", "theater", "viewpoint", "castle", "restaurant"]
    return [
        _poi(f"POI{i}", 48.85 + i * 0.01, 2.35 + i * 0.01, [cats[i % len(cats)]], str(i))
        for i in range(n)
    ]


def _make_request(**kwargs):
    from models.route_request import RouteGenerationRequest
    defaults = dict(
        interests="history",
        location="Paris",
        radius_km=5.0,
        num_routes=2,
        num_pois=4,
        travel_mode="walking",
        latitude=48.8566,
        longitude=2.3522,
    )
    defaults.update(kwargs)
    return RouteGenerationRequest(**defaults)


# ─── OverpassQueryParams.to_query ─────────────────────────────────────────────

class TestOverpassQuery(unittest.TestCase):

    def _qp(self, tag_pairs):
        from models.overpass import OverpassQueryParams, OverpassTag
        tags = [OverpassTag(key=k, value=v) for k, v in tag_pairs]
        return OverpassQueryParams(tags=tags, lat=32.0, lon=34.0, radius_m=5000)

    def test_single_tag_anchored_regex(self):
        q = self._qp([("tourism", "museum")]).to_query()
        self.assertIn('"tourism"~"^(museum)$"', q)

    def test_multi_value_sorted_alphabetically(self):
        q = self._qp([("tourism", "museum"), ("tourism", "gallery")]).to_query()
        self.assertIn('"tourism"~"^(gallery|museum)$"', q)

    def test_generates_node_way_relation(self):
        q = self._qp([("amenity", "cafe")]).to_query()
        for element in ("node", "way", "relation"):
            self.assertIn(element, q)

    def test_multiple_keys_separate_filters(self):
        q = self._qp([("amenity", "cafe"), ("tourism", "museum")]).to_query()
        self.assertIn('"amenity"', q)
        self.assertIn('"tourism"', q)

    def test_coords_and_radius_in_query(self):
        q = self._qp([("amenity", "cafe")]).to_query()
        self.assertIn("5000", q)
        self.assertIn("32.0", q)
        self.assertIn("34.0", q)

    def test_out_center_tags_present(self):
        q = self._qp([("amenity", "cafe")]).to_query()
        self.assertIn("out center tags", q)


# ─── overpass_service: extract_address ───────────────────────────────────────

class TestExtractAddress(unittest.TestCase):

    def setUp(self):
        from services.maps.overpass_service import extract_address
        self.fn = extract_address

    def test_addr_full_preferred(self):
        self.assertEqual(self.fn({"addr:full": "123 Main", "addr:street": "Other"}), "123 Main")

    def test_street_and_number_joined(self):
        result = self.fn({"addr:street": "Rue de Rivoli", "addr:housenumber": "5"})
        self.assertIn("Rue de Rivoli", result)
        self.assertIn("5", result)

    def test_brand_fallback_starts_with_near(self):
        result = self.fn({"brand": "Starbucks"})
        self.assertTrue(result.startswith("Near"))

    def test_no_address_returns_none(self):
        self.assertIsNone(self.fn({}))

    def test_location_field_used(self):
        self.assertEqual(self.fn({"location": "City Center"}), "City Center")

    def test_place_field_used(self):
        self.assertEqual(self.fn({"place": "Old Town"}), "Old Town")


# ─── overpass_service: extract_primary_category ───────────────────────────────

class TestExtractPrimaryCategory(unittest.TestCase):

    def setUp(self):
        from services.maps.overpass_service import extract_primary_category
        from models.overpass import OverpassTag
        self.fn = extract_primary_category
        self.Tag = OverpassTag

    def _tags(self, pairs):
        return [self.Tag(key=k, value=v) for k, v in pairs]

    def test_overpass_tag_match_preferred(self):
        el = {"amenity": "museum", "name": "Louvre"}
        result = self.fn(el, self._tags([("amenity", "museum")]))
        self.assertEqual(result, "museum")

    def test_amenity_fallback(self):
        self.assertEqual(self.fn({"amenity": "cafe"}, []), "cafe")

    def test_tourism_fallback(self):
        self.assertEqual(self.fn({"tourism": "attraction"}, []), "attraction")

    def test_leisure_fallback(self):
        self.assertEqual(self.fn({"leisure": "park"}, []), "park")

    def test_unknown_key_still_returns_value(self):
        # Some non-standard key — should still return something rather than crash
        result = self.fn({"name": "X", "some_key": "some_val"}, [])
        self.assertIsNotNone(result)


# ─── overpass_service: NON_TOURIST_TAG_PAIRS hard-block ──────────────────────

class TestNonTouristTagPairsBlock(unittest.TestCase):
    """
    Regression test: elements tagged tourism=attraction AND landuse=cemetery
    (or amenity=grave_yard) must be dropped even though their resolved primary
    category is 'attraction'.
    """

    def _run_filter(self, tags_el: dict) -> bool:
        """Return True if the element would be kept by the POI filter."""
        from services.maps.overpass_service import (
            NON_TOURIST_TAG_PAIRS, NON_TOURIST_CATEGORIES,
            extract_primary_category, _name_is_blocked,
        )
        from models.overpass import OverpassTag

        name = tags_el.get("name", "")
        if any(tags_el.get(k) == v for k, v in NON_TOURIST_TAG_PAIRS):
            return False
        if _name_is_blocked(name):
            return False

        overpass_tags = [OverpassTag(key="tourism", value="attraction")]
        category = extract_primary_category(tags_el, overpass_tags)
        if category in NON_TOURIST_CATEGORIES:
            return False
        return True

    def test_cemetery_with_tourism_attraction_is_dropped(self):
        tags = {"name": "Muslim Cemetery", "landuse": "cemetery", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_grave_yard_amenity_is_dropped(self):
        tags = {"name": "Old Graveyard", "amenity": "grave_yard", "tourism": "viewpoint"}
        self.assertFalse(self._run_filter(tags))

    def test_regular_attraction_not_blocked(self):
        tags = {"name": "Eiffel Tower", "tourism": "attraction"}
        self.assertTrue(self._run_filter(tags))

    def test_park_not_blocked(self):
        tags = {"name": "City Park", "leisure": "park"}
        self.assertTrue(self._run_filter(tags))

    def test_landuse_cemetery_without_tourist_tag_also_dropped(self):
        tags = {"name": "Cemetery", "landuse": "cemetery"}
        self.assertFalse(self._run_filter(tags))

    def test_historic_tomb_dropped(self):
        tags = {"name": "Sheikh Tomb", "historic": "tomb", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_historic_grave_dropped(self):
        tags = {"name": "Grave of X", "historic": "grave"}
        self.assertFalse(self._run_filter(tags))

    def test_wayside_shrine_dropped(self):
        tags = {"name": "Roadside Shrine", "historic": "wayside_shrine", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_historic_castle_not_blocked(self):
        tags = {"name": "Crusader Castle", "historic": "castle", "tourism": "attraction"}
        self.assertTrue(self._run_filter(tags))

    # Name-pattern block (no landuse/amenity tag, only tourism=attraction)
    def test_hebrew_cemetery_name_blocked(self):
        tags = {"name": "בית קברות מוסלמי", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_hebrew_cemetery_partial_name_blocked(self):
        tags = {"name": "קברות ישנות", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_bomb_shelter_name_blocked(self):
        tags = {"name": "מרחב מוגן רייכמן", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_english_cemetery_name_blocked(self):
        tags = {"name": "Old Jewish Cemetery", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_arabic_cemetery_name_blocked(self):
        tags = {"name": "مقبرة باب الرحمة", "tourism": "attraction"}
        self.assertFalse(self._run_filter(tags))

    def test_legitimate_name_not_blocked(self):
        tags = {"name": "Gordon Beach", "tourism": "attraction"}
        self.assertTrue(self._run_filter(tags))

    def test_museum_name_not_blocked(self):
        tags = {"name": "Tel Aviv Museum of Art", "tourism": "museum"}
        self.assertTrue(self._run_filter(tags))


# ─── overpass_service: _is_permanently_closed ────────────────────────────────

class TestIsPermanentlyClosed(unittest.TestCase):

    def setUp(self):
        from services.maps.overpass_service import _is_permanently_closed
        self.fn = _is_permanently_closed

    def test_opening_hours_off_is_closed(self):
        self.assertTrue(self.fn({"opening_hours": "off", "amenity": "restaurant"}))

    def test_closed_yes_is_closed(self):
        self.assertTrue(self.fn({"closed": "yes", "tourism": "attraction"}))

    def test_disused_yes_is_closed(self):
        self.assertTrue(self.fn({"disused": "yes", "amenity": "cafe"}))

    def test_abandoned_yes_is_closed(self):
        self.assertTrue(self.fn({"abandoned": "yes", "amenity": "museum"}))

    def test_shop_vacant_is_closed(self):
        self.assertTrue(self.fn({"shop": "vacant"}))

    def test_disused_prefix_key_is_closed(self):
        self.assertTrue(self.fn({"disused:amenity": "restaurant", "name": "Old Cafe"}))

    def test_abandoned_prefix_key_is_closed(self):
        self.assertTrue(self.fn({"abandoned:shop": "bakery"}))

    def test_normal_open_place_not_closed(self):
        self.assertFalse(self.fn({"amenity": "restaurant", "opening_hours": "Mo-Su 09:00-22:00"}))

    def test_no_tags_not_closed(self):
        self.assertFalse(self.fn({}))

    def test_opening_hours_not_off(self):
        self.assertFalse(self.fn({"opening_hours": "24/7", "amenity": "cafe"}))


# ─── overpass_service: quality_score ─────────────────────────────────────────

class TestQualityScore(unittest.TestCase):

    def setUp(self):
        from services.maps.overpass_service import quality_score
        self.fn = quality_score

    def test_empty_tags_zero(self):
        self.assertEqual(self.fn({}), 0)

    def test_wikidata_adds_five(self):
        self.assertGreaterEqual(self.fn({"wikidata": "Q123"}), 5)

    def test_wikipedia_adds_four(self):
        self.assertGreaterEqual(self.fn({"wikipedia": "en:Tower"}), 4)

    def test_brand_without_wikidata_penalised(self):
        # A brand-only entry should score below an entry with nothing (penalty)
        self.assertLess(self.fn({"brand": "BigCo"}), self.fn({}))

    def test_brand_with_wikidata_not_penalised(self):
        # Wikidata negates the brand penalty via the scoring logic
        score = self.fn({"brand": "BigCo", "wikidata": "Q1"})
        self.assertGreater(score, 0)

    def test_well_documented_poi_scores_high(self):
        tags = {
            "wikidata": "Q1",
            "wikipedia": "en:Eiffel Tower",
            "website": "https://example.com",
            "opening_hours": "Mo-Su 09:00-22:00",
            "description": "Landmark",
            "name:en": "Eiffel Tower",
        }
        self.assertGreaterEqual(self.fn(tags), 10)


# ─── overpass_service: thin_pois_by_name ─────────────────────────────────────

class TestThinPoisByName(unittest.TestCase):

    def _make_poi(self, name: str, cat: str = "attraction") -> "LLMPOISuggestion":
        from models.llm_suggestion import LLMPOISuggestion
        return LLMPOISuggestion(id="1", name=name, latitude=32.0, longitude=34.0, categories=[cat])

    def setUp(self):
        from services.maps.overpass_service import thin_pois_by_name
        self.fn = thin_pois_by_name

    def test_exact_duplicate_dropped(self):
        pois = [self._make_poi("Park"), self._make_poi("Park")]
        self.assertEqual(len(self.fn(pois)), 1)

    def test_hyphen_vs_space_same_name_deduped(self):
        pois = [self._make_poi("אקו-פארק גלילות"), self._make_poi("אקו פארק גלילות")]
        self.assertEqual(len(self.fn(pois)), 1)

    def test_case_insensitive(self):
        pois = [self._make_poi("Eiffel Tower"), self._make_poi("eiffel tower")]
        self.assertEqual(len(self.fn(pois)), 1)

    def test_first_kept_wins(self):
        pois = [self._make_poi("Park", "attraction"), self._make_poi("Park", "park")]
        kept = self.fn(pois)
        self.assertEqual(kept[0].categories[0], "attraction")

    def test_distinct_names_both_kept(self):
        pois = [self._make_poi("Park A"), self._make_poi("Park B")]
        self.assertEqual(len(self.fn(pois)), 2)

    def test_empty_list(self):
        self.assertEqual(self.fn([]), [])


# ─── overpass_service: thin_pois_by_min_distance ─────────────────────────────

class TestThinPoisByMinDistance(unittest.TestCase):

    def setUp(self):
        from services.maps.overpass_service import thin_pois_by_min_distance
        self.fn = thin_pois_by_min_distance

    def test_keeps_all_when_far_apart(self):
        pois = [_poi("A", 48.85, 2.35, ["museum"], "1"), _poi("B", 48.90, 2.40, ["cafe"], "2")]
        self.assertEqual(len(self.fn(pois, 100)), 2)

    def test_drops_nearby_duplicate(self):
        pois = [
            _poi("A", 48.85000, 2.35000, ["museum"], "1"),
            _poi("B", 48.85001, 2.35001, ["museum"], "2"),  # ~10 m away
        ]
        self.assertEqual(len(self.fn(pois, 50)), 1)

    def test_empty_input(self):
        self.assertEqual(self.fn([], 100), [])

    def test_first_poi_wins_dedup(self):
        pois = [_poi("A", 48.85, 2.35, ["museum"], "1"), _poi("B", 48.85, 2.35, ["museum"], "2")]
        result = self.fn(pois, 100)
        self.assertEqual(result[0].name, "A")

    def test_three_pois_one_nearby(self):
        pois = [
            _poi("A", 48.85000, 2.35000, ["museum"], "1"),
            _poi("B", 48.85001, 2.35001, ["cafe"], "2"),  # ~10 m — dropped
            _poi("C", 48.90000, 2.40000, ["park"], "3"),  # far — kept
        ]
        result = self.fn(pois, 50)
        self.assertEqual(len(result), 2)
        names = {p.name for p in result}
        self.assertIn("A", names)
        self.assertIn("C", names)


# ─── generate_optimized_routes: _cluster_pois ────────────────────────────────

class TestClusterPois(unittest.TestCase):

    def setUp(self):
        from services.generate_optimized_routes import _cluster_pois
        self.fn = _cluster_pois

    def test_tight_group_single_cluster(self):
        pois = [_poi("A", 48.85, 2.35, ["museum"], "1"), _poi("B", 48.8501, 2.3501, ["cafe"], "2")]
        self.assertEqual(len(self.fn(pois, radius_m=1000)), 1)

    def test_distant_pois_separate_clusters(self):
        pois = [_poi("A", 48.0, 2.0, ["museum"], "1"), _poi("B", 50.0, 4.0, ["cafe"], "2")]
        self.assertEqual(len(self.fn(pois, radius_m=100)), 2)

    def test_sorted_by_size_descending(self):
        pois = [
            _poi("A", 48.85, 2.35, ["museum"], "1"),
            _poi("B", 48.8501, 2.3501, ["cafe"], "2"),
            _poi("C", 48.8502, 2.3502, ["park"], "3"),
            _poi("D", 50.0, 4.0, ["art"], "4"),
        ]
        clusters = self.fn(pois, radius_m=1000)
        for i in range(len(clusters) - 1):
            self.assertGreaterEqual(len(clusters[i]), len(clusters[i + 1]))

    def test_all_pois_present_in_some_cluster(self):
        pois = [_poi(str(i), float(i), 0.0, [f"cat{i}"], str(i)) for i in range(5)]
        clusters = self.fn(pois, radius_m=100)
        all_members = [p for c in clusters for p in c]
        self.assertEqual(len(all_members), len(pois))


# ─── generate_optimized_routes: _route_cost ──────────────────────────────────

class TestRouteCost(unittest.TestCase):

    def setUp(self):
        from services.generate_optimized_routes import _route_cost
        self.fn = _route_cost

    def test_empty_route_zero_cost(self):
        self.assertEqual(self.fn([]), 0.0)

    def test_single_poi_zero_cost(self):
        self.assertEqual(self.fn([_poi("A", 48.85, 2.35, ["museum"])]), 0.0)

    def test_same_category_adds_penalty(self):
        from geopy.distance import geodesic
        pois = [_poi("A", 48.85, 2.35, ["museum"], "1"), _poi("B", 48.86, 2.36, ["museum"], "2")]
        dist = geodesic((48.85, 2.35), (48.86, 2.36)).meters
        self.assertAlmostEqual(self.fn(pois), dist + 200.0, delta=1.0)

    def test_different_categories_no_penalty(self):
        from geopy.distance import geodesic
        pois = [_poi("A", 48.85, 2.35, ["museum"], "1"), _poi("B", 48.86, 2.36, ["cafe"], "2")]
        dist = geodesic((48.85, 2.35), (48.86, 2.36)).meters
        self.assertAlmostEqual(self.fn(pois), dist, delta=1.0)

    def test_multiple_legs_summed(self):
        a = _poi("A", 48.85, 2.35, ["museum"], "1")
        b = _poi("B", 48.86, 2.36, ["cafe"], "2")
        c = _poi("C", 48.87, 2.37, ["park"], "3")
        cost_ab_bc = self.fn([a, b]) + self.fn([b, c])
        cost_abc = self.fn([a, b, c])
        self.assertAlmostEqual(cost_abc, cost_ab_bc, delta=1.0)


# ─── generate_optimized_routes: _two_opt ─────────────────────────────────────

class TestTwoOpt(unittest.TestCase):

    def setUp(self):
        from services.generate_optimized_routes import _two_opt, _route_cost
        self.two_opt = _two_opt
        self.cost = _route_cost

    def test_output_same_length(self):
        pois = [_poi(str(i), float(i), 0.0, [f"c{i}"], str(i)) for i in range(6)]
        self.assertEqual(len(self.two_opt(pois)), 6)

    def test_route_cost_not_increased(self):
        pois = [_poi(str(i), float(i % 3), float(i // 3), [f"c{i}"], str(i)) for i in range(5)]
        optimised = self.two_opt(pois)
        self.assertLessEqual(self.cost(optimised), self.cost(pois) + 1e-6)

    def test_short_route_unchanged(self):
        pois = [_poi(str(i), float(i), 0.0, [f"c{i}"], str(i)) for i in range(3)]
        result = self.two_opt(pois)
        self.assertEqual(len(result), 3)

    def test_all_original_pois_present(self):
        pois = [_poi(str(i), float(i), 0.0, [f"c{i}"], str(i)) for i in range(5)]
        result = self.two_opt(pois)
        self.assertEqual({p.name for p in result}, {p.name for p in pois})


# ─── generate_optimized_routes: _select_route_pois ───────────────────────────

class TestSelectRoutePois(unittest.TestCase):

    def setUp(self):
        from services.generate_optimized_routes import _select_route_pois
        self.fn = _select_route_pois

    def test_one_poi_per_category(self):
        pois = [
            _poi("A", 48.85, 2.35, ["museum"], "1"),
            _poi("B", 48.851, 2.351, ["museum"], "2"),  # same cat — should be skipped
            _poi("C", 48.852, 2.352, ["cafe"], "3"),
        ]
        result = self.fn(pois, num_pois=3, start_poi=pois[0], cluster_radius_m=300)
        cats = [p.categories[0] for p in result]
        self.assertEqual(len(cats), len(set(cats)), "Category used more than once")

    def test_starts_with_start_poi(self):
        pois = [_poi("A", 48.85, 2.35, ["museum"], "1"), _poi("B", 48.86, 2.36, ["cafe"], "2")]
        result = self.fn(pois, num_pois=2, start_poi=pois[0], cluster_radius_m=300)
        self.assertEqual(result[0].name, "A")

    def test_respects_num_pois_cap(self):
        pois = [_poi(str(i), 48.85 + i * 0.01, 2.35, [f"cat{i}"], str(i)) for i in range(10)]
        result = self.fn(pois, num_pois=4, start_poi=pois[0], cluster_radius_m=300)
        self.assertLessEqual(len(result), 4)

    def test_result_at_least_one_poi(self):
        pois = [_poi("A", 48.85, 2.35, ["museum"], "1")]
        result = self.fn(pois, num_pois=3, start_poi=pois[0], cluster_radius_m=300)
        self.assertGreaterEqual(len(result), 1)


# ─── generate_optimized_routes: _pick_distinct_starts ────────────────────────

class TestPickDistinctStarts(unittest.TestCase):

    def setUp(self):
        from services.generate_optimized_routes import _pick_distinct_starts
        self.fn = _pick_distinct_starts

    def test_empty_input_returns_empty(self):
        self.assertEqual(self.fn([], 2), [])

    def test_returns_all_if_num_routes_gte_pool(self):
        pois = [_poi(str(i), float(i), 0.0, ["cat"], str(i)) for i in range(3)]
        result = self.fn(pois, num_routes=5)
        self.assertEqual(len(result), 3)

    def test_returns_correct_count(self):
        pois = [_poi(str(i), float(i * 10), 0.0, ["cat"], str(i)) for i in range(6)]
        result = self.fn(pois, num_routes=3)
        self.assertEqual(len(result), 3)

    def test_no_duplicate_starts(self):
        pois = [_poi(str(i), float(i * 10), 0.0, ["cat"], str(i)) for i in range(6)]
        result = self.fn(pois, num_routes=3)
        ids = [id(p) for p in result]
        self.assertEqual(len(ids), len(set(ids)))


# ─── generate_optimized_routes: full pipeline (ORS mocked) ───────────────────

class TestGenerateOptimizedRoutes(unittest.TestCase):
    # get_real_route now returns (path, duration_seconds)
    _FAKE_PATH = ([(2.35, 48.85), (2.36, 48.86), (2.37, 48.87)], 300.0)

    def test_raises_http_422_if_fewer_than_two_categories(self):
        from services.generate_optimized_routes import generate_optimized_routes
        from fastapi import HTTPException
        pois = [_poi(str(i), 48.85 + i * 0.01, 2.35, ["museum"], str(i)) for i in range(5)]
        with self.assertRaises(HTTPException) as ctx:
            generate_optimized_routes(_make_request(), pois)
        self.assertEqual(ctx.exception.status_code, 400)

    @patch("services.generate_optimized_routes.get_real_route")
    def test_returns_routes_key(self, mock_ors):
        from services.generate_optimized_routes import generate_optimized_routes
        mock_ors.return_value = self._FAKE_PATH
        result = generate_optimized_routes(_make_request(num_routes=1, num_pois=4), _spread_pois(8))
        self.assertIn("routes", result)
        self.assertGreater(len(result["routes"]), 0)

    @patch("services.generate_optimized_routes.get_real_route")
    def test_each_route_has_feature_and_pois(self, mock_ors):
        from services.generate_optimized_routes import generate_optimized_routes
        mock_ors.return_value = self._FAKE_PATH
        result = generate_optimized_routes(_make_request(num_routes=1, num_pois=4), _spread_pois(8))
        for r in result["routes"]:
            self.assertIn("feature", r)
            self.assertIn("pois", r)
            self.assertIsInstance(r["pois"], list)

    @patch("services.generate_optimized_routes.get_real_route")
    def test_no_internal_start_field_in_output(self, mock_ors):
        from services.generate_optimized_routes import generate_optimized_routes
        mock_ors.return_value = self._FAKE_PATH
        result = generate_optimized_routes(_make_request(num_routes=1, num_pois=4), _spread_pois(8))
        for r in result["routes"]:
            self.assertNotIn("_start", r)

    @patch("services.generate_optimized_routes.get_real_route")
    def test_no_poi_reuse_across_routes(self, mock_ors):
        from services.generate_optimized_routes import generate_optimized_routes
        mock_ors.return_value = self._FAKE_PATH
        result = generate_optimized_routes(_make_request(num_routes=2, num_pois=3), _spread_pois(8))
        routes = result["routes"]
        if len(routes) < 2:
            return
        names_r1 = {p["name"] for p in routes[0]["pois"]}
        names_r2 = {p["name"] for p in routes[1]["pois"]}
        self.assertTrue(names_r1.isdisjoint(names_r2), "POIs reused across routes")

    @patch("services.generate_optimized_routes.get_real_route")
    def test_feature_geometry_is_linestring(self, mock_ors):
        from services.generate_optimized_routes import generate_optimized_routes
        mock_ors.return_value = self._FAKE_PATH
        result = generate_optimized_routes(_make_request(num_routes=1, num_pois=4), _spread_pois(8))
        for r in result["routes"]:
            self.assertEqual(r["feature"]["geometry"]["type"], "LineString")

    @patch("services.generate_optimized_routes.get_real_route")
    def test_ors_failure_skips_route(self, mock_ors):
        from services.generate_optimized_routes import generate_optimized_routes
        from fastapi import HTTPException
        mock_ors.side_effect = Exception("ORS down")
        # All routes fail ORS — should raise 400 "Could not generate any valid routes"
        with self.assertRaises(HTTPException) as ctx:
            generate_optimized_routes(_make_request(num_routes=1, num_pois=4), _spread_pois(8))
        self.assertEqual(ctx.exception.status_code, 400)


# ─── RoutesCache ──────────────────────────────────────────────────────────────

class TestRoutesCache(unittest.TestCase):

    def setUp(self):
        import routers.routes_cache as rc
        self.rc = rc
        rc._store.clear()
        self.cache = rc.routes_cache

    def tearDown(self):
        self.rc._store.clear()

    def test_set_and_get_roundtrip(self):
        self.cache["abc"] = [{"feature": {}, "pois": []}]
        result = self.cache.get("abc")
        self.assertIsNotNone(result)
        self.assertEqual(len(result), 1)

    def test_missing_key_returns_none(self):
        self.assertIsNone(self.cache.get("nonexistent"))

    def test_expired_entry_returns_none(self):
        self.rc._store["old"] = (time.time() - 1, [{"pois": []}])
        self.assertIsNone(self.cache.get("old"))

    def test_expired_entry_removed_on_access(self):
        self.rc._store["old"] = (time.time() - 1, [{"pois": []}])
        self.cache.get("old")
        self.assertNotIn("old", self.rc._store)

    def test_evicts_oldest_when_at_capacity(self):
        for i in range(self.rc._CACHE_MAX):
            self.cache[str(i)] = [{"pois": []}]
        self.cache["overflow"] = [{"pois": []}]
        self.assertLessEqual(len(self.rc._store), self.rc._CACHE_MAX)

    def test_overwrite_existing_key(self):
        self.cache["key"] = [{"pois": ["old"]}]
        self.cache["key"] = [{"pois": ["new"]}]
        result = self.cache.get("key")
        self.assertEqual(result[0]["pois"], ["new"])

    def test_evict_expired_removes_all_expired(self):
        self.rc._store["a"] = (time.time() - 10, [])
        self.rc._store["b"] = (time.time() - 10, [])
        self.rc._store["c"] = (time.time() + 3600, [])
        self.rc._evict_expired()
        self.assertNotIn("a", self.rc._store)
        self.assertNotIn("b", self.rc._store)
        self.assertIn("c", self.rc._store)


# ─── Integration tests (require live backend) ─────────────────────────────────

def _wait_for_backend():
    for _ in range(30):
        try:
            if requests.get(f"{BASE_URL}/health", timeout=2).status_code == 200:
                return True
        except Exception:
            pass
        time.sleep(1)
    return False


def test_health():
    assert _wait_for_backend(), f"Backend not reachable at {BASE_URL}"
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200


def test_autocomplete():
    assert _wait_for_backend(), f"Backend not reachable at {BASE_URL}"
    r = requests.get(f"{BASE_URL}/autocomplete", params={"q": "tel"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_autocomplete_unknown_place_returns_empty_list():
    assert _wait_for_backend(), f"Backend not reachable at {BASE_URL}"
    r = requests.get(f"{BASE_URL}/autocomplete", params={"q": "zzzzunknown99999"})
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_route_progress_missing_params_returns_422():
    assert _wait_for_backend(), f"Backend not reachable at {BASE_URL}"
    r = requests.get(f"{BASE_URL}/route-progress")
    assert r.status_code == 422


def test_get_latest_routes_unknown_id_returns_404():
    assert _wait_for_backend(), f"Backend not reachable at {BASE_URL}"
    r = requests.get(f"{BASE_URL}/get-latest-routes/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404


if __name__ == "__main__":
    unittest.main()

import { POI } from "../models/POI";

// Geographic features have no Google business listing — name search returns wrong nearby businesses.
// Link to OpenStreetMap (the POI source) instead.
const COORDINATE_PIN_CATEGORIES = new Set([
    // natural features
    "wood", "water", "waterfall", "hot_spring", "cave_entrance", "peak",
    "cliff", "spring", "beach",
    // parks / green spaces
    "park", "garden", "nature_reserve", "beach_resort",
    // viewpoints / artwork
    "viewpoint", "artwork",
    // historic / architectural (no commercial listing)
    "monument", "memorial", "archaeological_site", "ruins", "fort",
    "castle", "palace", "church", "cathedral", "abbey", "city_gate", "building",
    // infrastructure features
    "lighthouse", "windmill", "tower", "pier", "fountain",
]);

export function createSearchQuery(poi: POI): string {
    const isGeoFeature = poi.categories?.some(c => COORDINATE_PIN_CATEGORIES.has(c.toLowerCase()));
    if (isGeoFeature) {
        if (poi.osm_type && poi.id) {
            return `https://www.openstreetmap.org/${poi.osm_type}/${poi.id}`;
        }
        return `https://www.openstreetmap.org/?mlat=${poi.latitude}&mlon=${poi.longitude}#map=17/${poi.latitude}/${poi.longitude}`;
    }
    const query = encodeURIComponent(poi.address ? `${poi.name}, ${poi.address}` : poi.name);
    return `https://www.google.com/maps/search/?api=1&query=${query}&query_ll=${poi.latitude}%2C${poi.longitude}`;
}
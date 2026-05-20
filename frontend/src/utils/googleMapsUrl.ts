import { POI } from "../models/POI";

export function buildGoogleMapsUrl(pois: POI[]): string {
    const valid = pois.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    if (valid.length === 0) return "https://www.google.com/maps";

    const origin = `${valid[0].latitude},${valid[0].longitude}`;
    const destination = `${valid[valid.length - 1].latitude},${valid[valid.length - 1].longitude}`;
    const middle = valid.slice(1, -1);

    const params = new URLSearchParams({ api: "1", origin, destination });
    if (middle.length > 0) {
        // GMaps free tier supports up to 8 intermediate waypoints
        params.set("waypoints", middle.slice(0, 8).map(p => `${p.latitude},${p.longitude}`).join("|"));
    }
    return `https://www.google.com/maps/dir/?${params.toString()}`;
}

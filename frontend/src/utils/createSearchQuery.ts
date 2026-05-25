import { POI } from "../models/POI";

export function createSearchQuery(poi: POI): string {
    const name = encodeURIComponent(poi.name);
    return `https://www.google.com/maps/place/${name}/@${poi.latitude},${poi.longitude},17z`;
}
import { POI } from "../models/POI";

export function createSearchQuery(poi: POI): string {
    const parts: string[] = [poi.name];
    if (poi.categories?.[0]) parts.push(poi.categories[0]);
    if (poi.address) parts.push(poi.address);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(' '))}`;
}
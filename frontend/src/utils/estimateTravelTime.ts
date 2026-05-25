import { SPEED_BY_MODE } from "../constants/formDefaults";

export function estimateTravelTime(travelMode: string, radiusKm: number): string {
    const speed = SPEED_BY_MODE[travelMode] ?? SPEED_BY_MODE.walking;
    // Estimate: cover 2x radius at average speed (there and back traversal)
    const estimatedDistance = radiusKm * 2;
    const estimatedHours = estimatedDistance / speed;
    const estimatedMinutes = Math.round(estimatedHours * 60);

    if (estimatedMinutes < 60) {
        return `~${estimatedMinutes} min`;
    }
    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;
    return `~${hours}h ${minutes}m`;
}

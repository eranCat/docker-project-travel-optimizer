export const FORM_VERSION = 8;

export const RADIUS_BY_MODE: Record<string, number> = {
    walking: 3,
    cycling: 8,
    driving: 15,
};

export const SPEED_BY_MODE: Record<string, number> = {
    walking: 5,      // km/h
    cycling: 18,     // km/h
    driving: 50,     // km/h
};

export const DEFAULT_FORM = {
    interests: "",
    location: "",
    radius_km: 3,
    num_routes: 2,
    num_pois: 6,
    travel_mode: "walking",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    time_of_day: "" as string,
    num_days: 1,
    // "explore" = POIs around one location; "trip" = A→B route through a corridor
    mode: "explore" as "explore" | "trip",
    dest_location: "",
    dest_latitude: undefined as number | undefined,
    dest_longitude: undefined as number | undefined,
};

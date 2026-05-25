export const FORM_VERSION = 7;

export const DEFAULT_FORM = {
    interests: "",
    location: "",
    radius_km: 5,
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

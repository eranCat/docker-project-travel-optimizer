import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Accept": "application/json",
  },
});

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function logToServer(level: "info" | "warning" | "error", message: string, data?: unknown) {
  try {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/frontend-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message, data }),
      credentials: "omit",
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore — logging must never break the app
  }
}

const isLatinScript = (s: string) => /^[ -ɏ\s\d\p{P}]+$/u.test(s);

export const fetchLocationSuggestions = async (
  query: string,
  signal?: AbortSignal,
  lang?: string
): Promise<{ display_name: string; lat: string; lon: string }[]> => {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  if (lang === "he") {
    url.searchParams.set("accept-language", "he,en");
  } else if (isLatinScript(query)) {
    url.searchParams.set("accept-language", "en");
  }

  const res = await fetch(url.toString(), { signal });
  if (!res.ok) return [];
  return res.json();
};

export function routeProgress(params: {
  interests: string;
  location: string;
  radius_km: number;
  num_routes: number;
  num_pois: number;
  travel_mode: string;
  latitude?: number;
  longitude?: number;
  wheelchair?: boolean;
  time_of_day?: string;
  dest_location?: string;
  dest_latitude?: number;
  dest_longitude?: number;
  lang?: string;
}): EventSource {
  const url = new URL("/route-progress", import.meta.env.VITE_API_BASE_URL);
  const searchParams: Record<string, string> = {
    interests: params.interests,
    location: params.location,
    radius_km: String(params.radius_km),
    num_routes: String(params.num_routes),
    num_pois: String(params.num_pois),
    travel_mode: String(params.travel_mode),
  };

  if (params.latitude !== undefined) searchParams.latitude = String(params.latitude);
  if (params.longitude !== undefined) searchParams.longitude = String(params.longitude);
  if (params.wheelchair) searchParams.wheelchair = "true";
  if (params.time_of_day) searchParams.time_of_day = params.time_of_day;
  if (params.dest_location) searchParams.dest_location = params.dest_location;
  if (params.dest_latitude !== undefined) searchParams.dest_latitude = String(params.dest_latitude);
  if (params.dest_longitude !== undefined) searchParams.dest_longitude = String(params.dest_longitude);
  if (params.lang) searchParams.lang = params.lang;

  url.search = new URLSearchParams(searchParams).toString();
  return new EventSource(url.toString());
}


export const getLatestRoutes = async (routeId: string) => {
  try {
    const res = await API.get(`/get-latest-routes/${routeId}`);
    return res.data.routes;
  } catch (error: any) {
    throw new Error(error?.response?.data?.detail || "Failed to load routes");
  }
};

// --- Dev test endpoints ---

const BASE = import.meta.env.VITE_API_BASE_URL as string;

export interface TestResult {
    ok: boolean;
    latency_s?: number;
    error?: string;
    [key: string]: unknown;
}

export async function testGroq(interests = "bars, parks, museums"): Promise<TestResult> {
    const r = await fetch(`${BASE}/test/groq?interests=${encodeURIComponent(interests)}`, { signal: AbortSignal.timeout(15000) });
    return r.json();
}

export async function testOverpass(lat = 32.0853, lon = 34.7818): Promise<TestResult> {
    const r = await fetch(`${BASE}/test/overpass?lat=${lat}&lon=${lon}&radius_km=1`, { signal: AbortSignal.timeout(30000) });
    return r.json();
}

export async function testORS(lat = 32.0853, lon = 34.7818): Promise<TestResult> {
    const r = await fetch(`${BASE}/test/ors?lat=${lat}&lon=${lon}`, { signal: AbortSignal.timeout(15000) });
    return r.json();
}

export async function testCache(): Promise<TestResult> {
    const r = await fetch(`${BASE}/test/cache`, { signal: AbortSignal.timeout(5000) });
    return r.json();
}

export async function testRoute(interests: string, location: string): Promise<TestResult> {
    const r = await fetch(
        `${BASE}/test/route?interests=${encodeURIComponent(interests)}&location=${encodeURIComponent(location)}&num_routes=1&num_pois=3`,
        { signal: AbortSignal.timeout(60000) }
    );
    return r.json();
}

export class ReplacePOIError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export async function replacePOI(
  routeId: string,
  routeIndex: number,
  poiIndex: number,
) {
  try {
    const res = await API.post("/replace-poi", {
      route_id: routeId,
      route_index: routeIndex,
      poi_index: poiIndex,
    });
    return res.data;
  } catch (error: any) {
    const status = error?.response?.status ?? 0;
    const detail = error?.response?.data?.detail || "Failed to replace POI";
    throw new ReplacePOIError(detail, status);
  }
}

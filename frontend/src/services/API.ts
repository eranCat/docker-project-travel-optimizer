import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Accept": "application/json",
  },
});

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

export const fetchLocationSuggestions = async (query: string, signal?: AbortSignal) => {
  const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/autocomplete`, {
    params: { q: query },
    signal,
  });

  return res.data || [];
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

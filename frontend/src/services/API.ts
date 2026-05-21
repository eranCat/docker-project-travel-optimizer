import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Accept": "application/json",
  },
});

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
  travel_mode:string;
}): EventSource {
  const url = new URL("/route-progress", import.meta.env.VITE_API_BASE_URL);
  url.search = new URLSearchParams({
    interests: params.interests,
    location: params.location,
    radius_km: String(params.radius_km),
    num_routes: String(params.num_routes),
    num_pois: String(params.num_pois),
    travel_mode : String(params.travel_mode)
  }).toString();

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

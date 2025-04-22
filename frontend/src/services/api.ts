import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const generateRoutes = async (data: {
  interests: string;
  location: string;
  radius_km: number;
  num_routes: number;
  num_pois: number;
}) => {
  const res = await API.post("/routes/generate-paths", data);
  return res.data;
};

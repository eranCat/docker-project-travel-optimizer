import { useState } from "react";
import MapViewer from "./components/MapViewer";
import { generateRoutes } from "./services/api";

function App() {
  const [form, setForm] = useState({
    interests: "yoga, vegan food, art",
    location: "tel aviv",
    radius_km: 2,
    num_routes: 1,
    num_pois: 5,
  });

  const [routes, setRoutes] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await generateRoutes({
        ...form,
        radius_km: Number(form.radius_km),
        num_routes: Number(form.num_routes),
        num_pois: Number(form.num_pois),
      });
      setRoutes(data);
      console.log("Received routes:", data);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setError("Failed to fetch routes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>Travel Optimizer</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <input
          name="interests"
          placeholder="Interests"
          value={form.interests}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "0.5rem" }}
        />
        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "0.5rem" }}
        />
        <input
          name="radius_km"
          type="number"
          placeholder="Radius in KM"
          value={form.radius_km}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "0.5rem" }}
        />
        <input
          name="num_routes"
          type="number"
          placeholder="Number of Routes"
          value={form.num_routes}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "0.5rem" }}
        />
        <input
          name="num_pois"
          type="number"
          placeholder="POIs per Route"
          value={form.num_pois}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "0.5rem" }}
        />

        <button type="submit" style={{ padding: "10px 20px" }}>
          {loading ? "Loading..." : "Generate Route"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && routes.length > 0 && (
        <MapViewer pois={routes[0]} />
      )}
    </div>
  );
}

export default App;

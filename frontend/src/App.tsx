import { useState } from "react";
import MapViewer from "./components/MapViewer";
import { generateRoutes } from "./services/api";
import LinearLoader from "./components/LinearLoader";

function App() {
  const [form, setForm] = useState({
    interests: "yoga, vegan food, art",
    location: "tel aviv",
    radius_km: 2,
    num_routes: 2,
    num_pois: 5,
  });

  const [routes, setRoutes] = useState<any[][]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
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
      setSelectedIndex(0);
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
      <h1 style={{ marginBottom: "1rem" }}>Travel Optimizer</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <label>Interests</label>
        <input
          name="interests"
          value={form.interests}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />

        <label>Location</label>
        <input
          name="location"
          value={form.location}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />

        <label>Radius (km)</label>
        <input
          name="radius_km"
          type="number"
          value={form.radius_km}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />

        <label>Number of Routes</label>
        <input
          name="num_routes"
          type="number"
          value={form.num_routes}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />

        <label>POIs per Route</label>
        <input
          name="num_pois"
          type="number"
          value={form.num_pois}
          onChange={handleChange}
          style={{ width: "100%", padding: "8px", marginBottom: "1rem" }}
        />

        <button type="submit" style={{ padding: "10px 20px", width: "100%", backgroundColor: "#2f80ed", color: "white", border: "none", borderRadius: "4px" }}>
          {loading ? "Generating..." : "Generate Route"}
        </button>
      </form>

      {loading && <LinearLoader />}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && routes.length > 1 && (
        <div style={{ marginBottom: "1rem" }}>
          <label>Select a Route:</label>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(Number(e.target.value))}
            style={{ width: "100%", padding: "8px", marginTop: "0.5rem" }}
          >
            {routes.map((_, index) => (
              <option key={index} value={index}>
                Route {index + 1}
              </option>
            ))}
          </select>
        </div>
      )}

      {!loading && routes.length > 0 && (
        <MapViewer pois={routes[selectedIndex]} />
      )}
    </div>
  );
}

export default App;

import { useState } from "react";
import "./styles/theme.css";

import MapViewer from "./components/MapViewer";
import DarkModeToggle from "./components/DarkModeToggle";
import RouteForm from "./components/RouteForm";
import RouteSelector from "./components/RouteSelector";
import AlertMessage from "./components/AlertMessage";
import CoolLoader from "./components/CoolLoader";
import MainLayout from "./components/MainLayout";

import { generateRoutes } from "./services/api";
import { DEFAULT_FORM } from "./constants/formDefaults";
import { usePersistedState } from "./hooks/usePersistedState";

function App() {

  const [form, setForm] = usePersistedState("travel-form", DEFAULT_FORM);
  const [routes, setRoutes] = usePersistedState<any[][]>("travel-routes", []);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isFormValid = () => {
    return (
      form.interests.trim() !== "" &&
      form.location.trim() !== "" &&
      form.radius_km > 0 &&
      form.num_routes > 0 &&
      form.num_pois > 0
    );
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem("travel-form", JSON.stringify(updated));
      localStorage.setItem("travel-form-time", Date.now().toString());
      return updated;
    });
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
      localStorage.setItem("travel-routes", JSON.stringify(data));
      setSelectedIndex(0);
      console.log("Received routes:", data);
    } catch (err: any) {
      console.error("Error fetching routes:", err);

      let message = "Failed to fetch routes.";

      // Try to extract the real error message from Axios/Fetch response
      if (err?.response?.data?.error) {
        message = err.response.data.error;
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const fresh = { ...DEFAULT_FORM };
    setForm(fresh);
    localStorage.setItem("travel-form", JSON.stringify(fresh));
    localStorage.removeItem("travel-form-time");
  };

  return (
    <MainLayout
      title="Travel Optimizer"
      footer="🚀 Built with React, Vite, and FastAPI"
      centered
    >
      <RouteForm
        form={form}
        loading={loading}
        isFormValid={isFormValid()}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onReset={handleReset}
      />

      {loading && <CoolLoader />}
      <AlertMessage message={error} />

      <RouteSelector
        selectedIndex={selectedIndex}
        routeCount={routes.length}
        onSelect={setSelectedIndex}
      />

      <MapViewer pois={routes[selectedIndex] ?? []} />
    </MainLayout>
  );
}

export default App;

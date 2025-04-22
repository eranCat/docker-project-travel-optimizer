import { useState } from "react";
import "./styles/theme.css";

import MapViewer from "./components/MapViewer";
import RouteForm from "./components/RouteForm";
import RouteSelector from "./components/RouteSelector";
import AlertMessage from "./components/AlertMessage";
import CoolLoader from "./components/CoolLoader";
import MainLayout from "./components/MainLayout";

import { generateRoutes } from "./services/api";
import { DEFAULT_FORM } from "./constants/formDefaults";
import { usePersistedState } from "./hooks/usePersistedState";
import { Button } from "@mui/material";

function App({
  toggleTheme,
  mode,
}: {
  toggleTheme: () => void;
  mode: "light" | "dark";
}) {

  const [form, setForm] = usePersistedState("travel-form", DEFAULT_FORM);
  const [routes, setRoutes] = usePersistedState<any[][]>("travel-routes", []);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [locationSelected, setLocationSelected] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const isFormValid = () => {
    return (
      locationSelected &&
      form.interests.trim() !== "" &&
      form.location.trim() !== "" &&
      form.radius_km > 0 &&
      form.num_routes > 0 &&
      form.num_pois > 0
    );
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Reset "valid" location when user edits manually
    if (name === "location") setLocationSelected(false);

    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      localStorage.setItem("travel-form", JSON.stringify(updated));
      localStorage.setItem("travel-form-time", Date.now().toString());
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setError("");

    try {
      const data = await generateRoutes(
        {
          ...form,
          radius_km: Number(form.radius_km),
          num_routes: Number(form.num_routes),
          num_pois: Number(form.num_pois),
        },
        controller.signal // pass AbortSignal
      );
      setRoutes(data);
      localStorage.setItem("travel-routes", JSON.stringify(data));
      setSelectedIndex(0);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.warn("Route generation cancelled");
      } else {
        setError(err?.message || "Failed to fetch routes.");
      }
    } finally {
      setAbortController(null);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
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
    >

      <Button onClick={toggleTheme} sx={{ mb: 2 }}>
        {mode === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
      </Button>

      <RouteForm
        form={form}
        loading={loading}
        isFormValid={isFormValid()}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        onReset={handleReset}
        onValidLocationSelected={() => setLocationSelected(true)}
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

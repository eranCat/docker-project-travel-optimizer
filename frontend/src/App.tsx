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
import { Button, Box, Typography, Paper, List, ListItem, ListItemText, Divider } from "@mui/material";
import axios from "axios";
import React from "react";

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
      if (axios.isCancel?.(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        console.warn("Route generation was canceled by the user.");

        // ✅ Clear loading state and controller
        setLoading(false);
        setAbortController(null);

        // ✅ Optionally show a short "Cancelled" message
        setError("❌ Route generation was cancelled.");
        setTimeout(() => setError(""), 2000);

        return;
      }

      console.error("Error fetching routes:", err);
      setError(err?.message || "Failed to fetch routes.");
    } finally {
      if (!abortController?.signal.aborted) {
        setAbortController(null);
        setLoading(false);
      }
    };
  }

  const handleCancel = () => {
    abortController?.abort();
    setAbortController(null);
    setLoading(false);
    setError("❌ Route generation was cancelled.");
    setTimeout(() => setError(""), 2000);
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

      <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
        {/* POI List Panel */}
        <Paper sx={{ flex: 2, maxHeight: "500px", overflowY: "auto", p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Route {selectedIndex + 1} POIs
          </Typography>
          <List dense>
            {(routes[selectedIndex] ?? []).map((poi, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={poi.name}
                    secondary={
                      <>
                        {poi.description && (
                          <span style={{ display: "block", color: "gray", fontSize: "0.875rem" }}>
                            {poi.description}
                          </span>
                        )}

                        {poi.address && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(poi.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "block",
                              marginTop: "0.25rem",
                              color: "#1976d2",
                              textDecoration: "none",
                            }}
                          >
                            📍 {poi.address}
                          </a>
                        )}
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Map */}
        <Box sx={{ flex: 3}}>
          <MapViewer pois={routes[selectedIndex] ?? []} />
        </Box>
      </Box>

    </MainLayout>
  );
}

export default App;

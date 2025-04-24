import { useRef, useState } from "react";
import RouteForm from "./components/RouteForm";
import RouteSelector from "./components/RouteSelector";
import AlertMessage from "./components/AlertMessage";
import CoolLoader from "./components/CoolLoader";
import MainLayout from "./components/MainLayout";
import { generateRoutes } from "./services/api";
import { DEFAULT_FORM } from "./constants/formDefaults";
import MapViewer from "./components/MapViewer";
import { usePersistedState } from "./hooks/usePersistedState";
import { Button, Box, Paper, List, ListItem, ListItemText, Divider } from "@mui/material";
import React from "react";
import { Feature } from "geojson";
import { POI } from "./models/POI";
import "./styles/theme.css";

// RouteData shape coming from backend
export type RouteData = {
  feature: Feature;
  pois: POI[];
};

function App({ toggleTheme, mode }: { toggleTheme: () => void; mode: "light" | "dark" }) {
  const [form, setFormData] = usePersistedState("travel-form", DEFAULT_FORM);
  const [routes, setRoutes] = usePersistedState<RouteData[]>("travel-routes", []);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [locationSelected, setLocationSelected] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [focusedPOI, setFocusedPOI] = useState<POI | null>(null);

  // current route and pois
  const currentRoute = routes[selectedIndex] ?? null;
  const pois = currentRoute ? currentRoute.pois : [];
  const currentRouteFeature = currentRoute ? currentRoute.feature : null;

  const isFormValid = () =>
    locationSelected &&
    form.interests.trim() !== "" &&
    form.location.trim() !== "" &&
    form.radius_km > 0 &&
    form.num_routes > 0 &&
    form.num_pois > 0;

  const canceledRef = useRef(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "location") setLocationSelected(false);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (canceledRef.current) {
      canceledRef.current = false;
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setError("");

    try {
      // now expecting data.routes: RouteData[]
      const data = await generateRoutes(
        {
          ...form,
          radius_km: Number(form.radius_km),
          num_routes: Number(form.num_routes),
          num_pois: Number(form.num_pois),
        },
        controller.signal
      );

      setRoutes(data.routes);
      setSelectedIndex(0);
    } catch (err: any) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") return;
      const detailMessage = err?.response?.data?.detail || err?.message || "Failed to fetch routes.";
      setError(detailMessage);
      alert(`⚠️ ${detailMessage}`);
    } finally {
      setAbortController(null);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    canceledRef.current = true;
    abortController?.abort();
    setError("❌ Route generation was cancelled.");
    setTimeout(() => setError(""), 2000);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_FORM });
    localStorage.removeItem("travel-form-time");
  };

  return (
    <MainLayout title="Travel Optimizer" footer="🚀 Built with React, Vite, and FastAPI" mode={mode} toggleTheme={toggleTheme}>
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

      <RouteSelector selectedIndex={selectedIndex} routeCount={routes.length} onSelect={setSelectedIndex} />

      <Box sx={{ display: "flex", gap: 2, mt: 2, height: 500 }}>
        {/* POI List Panel */}
        <Paper sx={{ flex: 2, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
            <List dense>
              {pois.map((poi, idx) => (
                <React.Fragment key={idx}>
                  <ListItem alignItems="flex-start" disableGutters>
                    <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", textAlign: "start" }}>
                      <Box sx={{ flex: 1 }}>
                        <ListItemText
                          primary={poi.name}
                          secondary={
                            <>
                              {poi.description && (
                                <span style={{ display: "block", color: "gray", fontSize: "0.875rem" }}>{poi.description}</span>
                              )}
                              {poi.address && (
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${poi.name} ${poi.address}`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ display: "block", marginTop: "0.25rem", color: "#1976d2", textDecoration: "none" }}
                                >
                                  📍 {poi.address}
                                </a>
                              )}
                            </>
                          }
                        />
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => { if (Number.isFinite(poi.latitude) && Number.isFinite(poi.longitude)) setFocusedPOI(poi); }}
                        sx={{ textTransform: "none", whiteSpace: "nowrap", alignSelf: "center" }}
                      >
                        Show on Map
                      </Button>
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Paper>

        {/* Map View */}
        <Box sx={{ flex: 3, height: "100%" }}>
          <MapViewer pois={pois} focusedPOI={focusedPOI} routeFeature={currentRouteFeature} />
        </Box>
      </Box>
    </MainLayout>
  );
}

export default App;

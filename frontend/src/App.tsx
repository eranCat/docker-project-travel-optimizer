import React, { useRef, useState, FormEvent } from "react";
import RouteForm from "./components/RouteForm";
import RouteSelector from "./components/RouteSelector";
import AlertMessage from "./components/AlertMessage";
import { LinearProgress, Typography, Box, Button, Paper, List, ListItem, ListItemText, Divider } from "@mui/material";
import MainLayout from "./components/MainLayout";
import { routeProgress, getLatestRoutes } from "./services/api";
import { DEFAULT_FORM } from "./constants/formDefaults";
import MapViewer from "./components/MapViewer";
import { usePersistedState } from "./hooks/usePersistedState";
import { Feature } from "geojson";
import { POI } from "./models/POI";
import "./styles/theme.css";

// RouteData shape coming from backend
export type RouteData = {
  feature: Feature;
  pois: POI[];
};

export default function App({ toggleTheme, mode }: { toggleTheme: () => void; mode: "light" | "dark" }) {
  const [form, setFormData] = usePersistedState("travel-form", DEFAULT_FORM);
  const [routes, setRoutes] = usePersistedState<RouteData[]>("travel-routes", []);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [locationSelected, setLocationSelected] = useState(false);
  const canceledRef = useRef(false);
  // Track the currently focused POI for map centering
  const [focusedPOI, setFocusedPOI] = useState<POI | null>(null);

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

  const stages = [
    "Converting interests to tags",
    "Fetching POIs",
    "Filtering & thinning POIs",
    "Building routes",
    "Rendering results",
  ];

  function createSearchQuery(poi: POI): string {
    const parts: string[] = [poi.name];
    if (poi.categories?.[0]) parts.push(poi.categories[0]);
    if (poi.address) parts.push(poi.address);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(' '))}`;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "location") setLocationSelected(false);
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sseRef = useRef<EventSource | null>(null);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!isFormValid()) return;
    if (canceledRef.current) {
      canceledRef.current = false;
      return;
    }

    // Clean up any previous SSE
    sseRef.current?.close();
    setLoading(true);
    setError("");
    setStage(0);

    const source = routeProgress({
      interests: form.interests,
      location: form.location,
      radius_km: form.radius_km,
      num_routes: form.num_routes,
      num_pois: form.num_pois,
      travel_mode: form.travel_mode,
    });

    sseRef.current = source;

    source.addEventListener("stage", (event: MessageEvent) => {
      const msg = event.data as string;
      const idx = stages.indexOf(msg);
      if (idx >= 0) setStage(idx);
    });

    source.addEventListener("complete", async (event: MessageEvent) => {
      const routeId = event.data;

      try {
        const { routes: rawRoutes } = await getLatestRoutes(routeId);
        // console.log("✅ Final route data:", rawRoutes);
        setRoutes(rawRoutes);
        setSelectedIndex(0);
        setStage(stages.length - 1);
        setError("");
      } catch (err: any) {
        console.error("❌ getLatestRoutes failed:", err);
        setError("❌ Failed to load routes: " + (err?.message || "unknown"));
      } finally {
        setLoading(false);
        source.close();
        sseRef.current = null;
      }
    });


    source.addEventListener(
      "error",
      (event: MessageEvent) => {
        // ✅ Ignore the error if the stream is already closed or null
        if (!sseRef.current || source.readyState === EventSource.CLOSED) {
          console.warn("🔥 Ignored SSE Error (already closed):", event);
          return;
        }

        // ❌ If not, treat it as a real error
        // console.warn("🔥 SSE Error:", event);
        setError("❌ Unknown error from server");
        setLoading(false);
        source.close();
        sseRef.current = null;
      },
      { once: true }
    );


  };

  const handleCancel = () => {
    canceledRef.current = true;
    setError("❌ Generation cancelled.");
    setLoading(false);
    setTimeout(() => setError(""), 2000);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_FORM });
    localStorage.removeItem("travel-form-time");
  };

  return (
    <MainLayout title="Travel Optimizer" footer="" mode={mode} toggleTheme={toggleTheme}>
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

      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="body2" color="textSecondary" component="span">
            {stages[stage]}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={Math.min(((stage + 1) / stages.length) * 100, 100)}
          />
        </Box>
      )}
      <AlertMessage message={error} />

      <Box sx={{ display: "flex", gap: 2, mt: 2, height: 500 }}>
        <Paper sx={{ flex: 2, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
            {routes.length > 0 &&
            <RouteSelector selectedIndex={selectedIndex} routeCount={routes.length} onSelect={setSelectedIndex} />
            }
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
            <List dense>
              {pois.map((poi, idx) => (
                <React.Fragment key={idx}>
                  <ListItem alignItems="flex-start" disableGutters>
                    <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", textAlign: "start" }}>
                      <Box sx={{ flex: 1 }}>
                      <ListItemText
                          primary={poi.address && (
                          <a
                            href={createSearchQuery(poi)}
                            target="_blank"
                            rel="noopener noreferrer"
                              style={{
                                display: "block",
                                marginTop: "0.25rem",
                                color: "#1976d2",
                                textDecoration: "none",
                                direction: detectDirectionFromText(poi.name),
                                textAlign: "start",
                              }}
                          >
                            {poi.name}
                          </a>
                          )}

                        secondary={
                          <>
                              {poi.description && (
                                <span style={{
                                  display: "block",
                                  fontSize: "0.75rem",
                                  direction: detectDirectionFromText(poi.description),
                                  textAlign: "start",
                                }}>
                                  {poi.description}
                                </span>
                              )}
                              {poi.categories && (
                                <span style={{
                                  display: "block",
                                  color: "gray",
                                  fontSize: "0.875rem",
                                  direction: "ltr",  // Categories list is always LTR (tags)
                                  textAlign: "start",
                                }}>
                                  {(poi.categories.length === 1 ? "Category" : "Categories") + " : " + poi.categories.join(', ')}
                                </span>
                              )}
                            </>
                          }

                          slotProps={{
                            primary: { sx: { textAlign: "start" } },
                            secondary: { sx: { textAlign: "start" } },
                          }}
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

function detectDirectionFromText(text: string): "ltr" | "rtl" {
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlChars.test(text) ? "rtl" : "ltr";
}

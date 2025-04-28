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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
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
    } catch (error: any) {
      if (error.response?.status === 422) {
        const message = error.response?.data?.detail as string | undefined;

        if (message) {
          setError(message);

          // 🌟 Only try to parse if message exists!
          const foundMatch = message.match(/Found only (\d+) matching locations/);
          if (foundMatch) {
            const found = parseInt(foundMatch[1], 10);
            if (found > 0 && found < 3) {
              const confirmExpand = confirm("We found only a few locations. Would you like to try expanding your search radius by 2x?");
              if (confirmExpand) {
                setFormData(prev => {
                  const newForm = { ...prev, radius_km: prev.radius_km * 2 };
                  // Retry after short delay
                  setTimeout(() => {
                    handleSubmit();
                  }, 300);
                  return newForm;
                });
              }
            }
          }
        } else {
          setError("We couldn't find enough locations. Try adjusting your search.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
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

  function createSearchQuery(poi: POI): string {
    const parts: string[] = [poi.name];
    if (poi.categories?.[0]) parts.push(poi.categories[0]);
    if (poi.address) parts.push(poi.address);
    const query = encodeURIComponent(parts.join(' '));
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

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

      {loading && <CoolLoader />}
      <AlertMessage message={error} />

      <Box sx={{ display: "flex", gap: 2, mt: 2, height: 500 }}>
        {/* Left Column: Route Selector and POI List */}
        <Paper sx={{ flex: 2, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Route Selector */}
          <Box sx={{ px: 2, py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
            <RouteSelector selectedIndex={selectedIndex} routeCount={routes.length} onSelect={setSelectedIndex} />
          </Box>
          {/* POI List */}
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
  const rtlChars = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/; // Hebrew, Arabic, Persian character ranges
  for (const char of text) {
    if (rtlChars.test(char)) {
      return "rtl";
    }
  }
  return "ltr";
}


export default App;

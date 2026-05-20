import { FormEvent, useRef, useState, useEffect } from "react";
import { usePersistedState } from "./usePersistedState";
import { RouteData } from "../models/RouteData";
import { POI } from "../models/POI";
import { DEFAULT_FORM, FORM_VERSION } from "../constants/formDefaults";
import { getLatestRoutes, routeProgress, logToServer } from "../services/API";

export function useRouteGenerator() {
    // Bust stale persisted form when defaults change
    if (Number(localStorage.getItem("travel-form-version") ?? 0) < FORM_VERSION) {
        localStorage.removeItem("travel-form");
        localStorage.setItem("travel-form-version", String(FORM_VERSION));
    }
    const [form, setFormData] = usePersistedState("travel-form", DEFAULT_FORM);
    const [routes, setRoutes] = usePersistedState<RouteData[]>("travel-routes", []);
    const [savedRoutes, setSavedRoutes] = useState<RouteData[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [stage, setStage] = useState(0);
    const [error, setError] = useState("");
    const [locationSelected, setLocationSelected] = useState(false);
    const canceledRef = useRef(false);
    // Track the currently focused POI for map centering
    const [focusedPOI, setFocusedPOI] = useState<POI | null>(null);

    const normalizedRoutes = Array.isArray(routes) ? routes : [];
    const validSelectedIndex = selectedIndex >= 0 && selectedIndex < normalizedRoutes.length ? selectedIndex : 0;
    const currentRoute = normalizedRoutes[validSelectedIndex] ?? null;
    const pois = Array.isArray(currentRoute?.pois) ? currentRoute.pois : [];
    const currentRouteFeature = currentRoute?.feature ?? null;

    const sseRef = useRef<EventSource | null>(null);

    const stages = [
        "Converting interests to tags",
        "Fetching POIs",
        "Filtering & thinning POIs",
        "Building routes",
        "Rendering results",
    ];

    const stageMap: Record<string, string> = {
        "fetching pois from maps_service": "Fetching POIs",
        "generating optimized routes": "Building routes",

        // Optional future-proof aliases (if backend ever changes)
        "fetching pois": "Fetching POIs",
        "building routes": "Building routes",
        "optimizing route": "Building routes",
        "fetching data": "Fetching POIs",
        "loading pois": "Fetching POIs",
        "computing": "Building routes",

        // Defaults for unimplemented steps
        "converting interests": "Converting interests to tags",
        "tagging": "Converting interests to tags",
        "filtering pois": "Filtering & thinning POIs",
        "rendering": "Rendering results",
    };      

    const isFormValid = () =>
        locationSelected &&
        form.interests.trim() !== "" &&
        form.location.trim() !== "" &&
        form.radius_km > 0 &&
        form.num_routes > 0 &&
        form.num_pois > 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "location") setLocationSelected(false);
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationSelected = (lat: number, lon: number) => {
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
    };

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
            ...(form.latitude !== undefined && form.longitude !== undefined && {
                latitude: form.latitude,
                longitude: form.longitude,
            }),
            wheelchair: form.wheelchair,
        });

        sseRef.current = source;

        source.addEventListener("stage", (event: MessageEvent) => {
            const raw = (event.data as string).trim().toLowerCase();
            console.log("📡 Received stage:", raw);

            const mapped = stageMap[raw] || raw;
            console.log("🗺️ Mapped to:", mapped);
            const idx = stages.findIndex(stage => stage.toLowerCase() === mapped.toLocaleLowerCase());

            if (idx >= 0) {
                setStage(idx);
            } else {
                console.warn("⚠️ Unrecognized stage:", raw);
            }
        });                             

        source.addEventListener("complete", async (event: MessageEvent) => {
            const routeId = event.data;
            logToServer("info", "SSE complete received", { routeId });

            try {
                const rawRoutes = await getLatestRoutes(routeId);
                logToServer("info", "getLatestRoutes returned", {
                    type: Array.isArray(rawRoutes) ? "array" : typeof rawRoutes,
                    count: Array.isArray(rawRoutes) ? rawRoutes.length : null,
                    firstKeys: Array.isArray(rawRoutes) && rawRoutes[0] ? Object.keys(rawRoutes[0]) : null,
                });

                if (!Array.isArray(rawRoutes)) {
                    throw new Error(`Expected array, got ${typeof rawRoutes}`);
                }

                setRoutes(rawRoutes);
                setSelectedIndex(0);
                setStage(stages.length - 1);
                setError("");
            } catch (err: any) {
                console.error("❌ getLatestRoutes failed:", err);
                logToServer("error", "getLatestRoutes failed", { message: err?.message, stack: err?.stack });
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
                if (!sseRef.current || source.readyState === EventSource.CLOSED) {
                    console.warn("🔥 Ignored SSE Error (already closed):", event);
                    return;
                }

                let errorText = event.data || "❌ Unknown error from server";

                try {
                    let parsed = null;
                    try {
                        parsed = JSON.parse(errorText);
                    } catch {
                        const match = errorText.match(/{.*}/s); // find JSON-like content
                        if (match) {
                            try {
                                parsed = JSON.parse(match[0].replace(/'/g, '"')); // fix single quotes
                            } catch {
                                // still failed, leave as raw string
                            }
                        }
                    }

                    if (typeof parsed === "object" && parsed.message) {
                        errorText = `❌ ${parsed.message}`;
                        if (Array.isArray(parsed.suggestions)) {
                            errorText += `\n\n💡 Suggestions:\n• ` + parsed.suggestions.join("\n• ");
                        }
                    }
                } catch (err) {
                    // If it's not JSON, leave as-is
                }

                setError(errorText);

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
        setRoutes([]);
        setSavedRoutes([]);
        setSelectedIndex(0);
        setError("");
        setLocationSelected(false);
        localStorage.removeItem("travel-form-time");
    };

    const handleEdit = () => {
        if (normalizedRoutes.length > 0) setSavedRoutes(normalizedRoutes);
        setRoutes([]);
        setSelectedIndex(0);
        setError("");
    };

    const handleBackToRoutes = () => {
        setRoutes(savedRoutes);
        setSavedRoutes([]);
        setError("");
    };

    // Initialize locationSelected if there is an existing location
    useEffect(() => {
        if (form.location && form.location.trim() !== "") {
            setLocationSelected(true);
        }
    }, []);

    return {
        form,
        setFormData,
        routes,
        selectedIndex,
        setSelectedIndex,
        pois,
        focusedPOI,
        setFocusedPOI,
        currentRouteFeature,
        loading,
        stage,
        stages,
        error,
        isFormValid,
        handleChange,
        handleLocationSelected,
        handleSubmit,
        handleCancel,
        handleReset,
        handleEdit,
        handleBackToRoutes,
        savedRoutes,
        locationSelected,
        setLocationSelected,
    };

}

import { FormEvent, useRef, useState } from "react";
import { usePersistedState } from "./usePersistedState";
import { RouteData } from "../models/RouteData";
import { POI } from "../models/POI";
import { DEFAULT_FORM } from "../constants/formDefaults";
import { getLatestRoutes, routeProgress } from "../services/API";

export function useRouteGenerator() {
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

    const sseRef = useRef<EventSource | null>(null);

    const stages = [
        "Converting interests to tags",
        "Fetching POIs",
        "Filtering & thinning POIs",
        "Building routes",
        "Rendering results",
    ];
    
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
    localStorage.removeItem("travel-form-time");
    };
        

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
        handleSubmit,
        handleCancel,
        handleReset,
        locationSelected,
        setLocationSelected,
    };

}

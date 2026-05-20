import { useState } from "react";
import { Box, Typography, Tabs, Tab, useTheme, useMediaQuery } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import MapIcon from "@mui/icons-material/Map";
import TuneIcon from "@mui/icons-material/Tune";
import RouteForm from "./RouteForm";
import MapViewer from "./MapViewer";
import { useRouteGenerator } from "../hooks/useRouteGenerator";
import RouteSidebar from "./RouteSidebar";

export default function MainContent({ backendHealthy }: { backendHealthy?: boolean | null }) {
    const {
        form,
        routes,
        currentRoute,
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
        handleSurpriseMe,
        handleShareRoute,
        savedRoutes,
        setLocationSelected,
    } = useRouteGenerator();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
    const [mobileTab, setMobileTab] = useState(0);

    const hasResults = pois.length > 0 || loading;

    const handleFocusPOI = (poi: typeof focusedPOI) => {
        if (poi) setFocusedPOI(poi);
        if (isMobile) setMobileTab(1);
    };

    const formProps = {
        form,
        loading,
        stage,
        stages,
        error,
        isFormValid: isFormValid() && backendHealthy !== false,
        onChange: handleChange,
        onSubmit: handleSubmit,
        onCancel: handleCancel,
        onReset: handleReset,
        onEdit: handleEdit,
        onBackToRoutes: handleBackToRoutes,
        hasSavedRoutes: savedRoutes.length > 0,
        onValidLocationSelected: () => setLocationSelected(true),
        onLocationSelected: handleLocationSelected,
        onSurpriseMe: handleSurpriseMe,
    };

    const mapPanel = (
        <Box sx={{ flexGrow: 1, minWidth: 0, height: "100%", position: "relative" }}>
            <MapViewer
                pois={pois}
                focusedPOI={focusedPOI}
                routeFeature={currentRouteFeature}
            />
            {!hasResults && (
                <Box
                    sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        pb: "10%",
                    }}
                >
                    <Box
                        sx={{
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                            px: 3.5,
                            py: 2.5,
                            textAlign: "center",
                            boxShadow: 3,
                            maxWidth: 260,
                        }}
                    >
                        <ExploreIcon sx={{ fontSize: 36, color: "primary.main", mb: 1.25, opacity: 0.85 }} />
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            sx={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
                        >
                            Plan your trip
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block", lineHeight: 1.5 }}>
                            Add your destination and interests, then hit Generate.
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );

    const sidebarPanel = hasResults && (
        <Box
            sx={{
                flexGrow: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                borderTop: "1px solid",
                borderColor: "divider",
                bgcolor: "background.default",
                overflow: "hidden",
            }}
        >
            <RouteSidebar
                routesCount={routes.length}
                selectedIndex={selectedIndex}
                onSelectRoute={setSelectedIndex}
                pois={pois}
                focusedPOI={focusedPOI}
                onFocusPOI={handleFocusPOI}
                loading={loading}
                currentRoute={currentRoute}
                onShareRoute={handleShareRoute}
                numDays={form.num_days}
            />
        </Box>
    );

    if (isMobile) {
        return (
            <Box sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
                {/* Tab bar */}
                <Tabs
                    value={mobileTab}
                    onChange={(_, v) => setMobileTab(v)}
                    variant="fullWidth"
                    sx={{
                        flexShrink: 0,
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                        minHeight: 44,
                        "& .MuiTab-root": { minHeight: 44, py: 0, fontSize: "0.8rem", gap: 0.5 },
                    }}
                >
                    <Tab label="Plan" icon={<TuneIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                    <Tab label="Map" icon={<MapIcon sx={{ fontSize: 16 }} />} iconPosition="start" />
                </Tabs>

                {/* Plan tab */}
                <Box
                    sx={{
                        display: mobileTab === 0 ? "flex" : "none",
                        flexDirection: "column",
                        flexGrow: 1,
                        overflow: "hidden",
                        bgcolor: "background.paper",
                    }}
                >
                    <RouteForm {...formProps} compact={hasResults} />
                    {sidebarPanel}
                </Box>

                {/* Map tab — always mounted so Leaflet doesn't re-init */}
                <Box
                    sx={{
                        display: mobileTab === 1 ? "flex" : "none",
                        flexGrow: 1,
                        minHeight: 0,
                        position: "relative",
                    }}
                >
                    {mapPanel}
                </Box>
            </Box>
        );
    }

    // Desktop — unchanged side-by-side layout
    return (
        <Box sx={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
            <Box
                sx={{
                    width: 340,
                    minWidth: 340,
                    flexShrink: 0,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    bgcolor: "background.paper",
                    borderRight: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                }}
            >
                <RouteForm {...formProps} compact={hasResults} />
                {sidebarPanel}
            </Box>
            {mapPanel}
        </Box>
    );
}

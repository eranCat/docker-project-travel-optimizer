import { Box, Typography, Collapse } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import RouteForm from "./RouteForm";
import MapViewer from "./MapViewer";
import { useRouteGenerator } from "../hooks/useRouteGenerator";
import RouteSidebar from "./RouteSidebar";

export default function MainContent() {
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
        savedRoutes,
        setLocationSelected,
    } = useRouteGenerator();

    const hasResults = pois.length > 0 || loading;

    return (
        <Box sx={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
            {/* Single left panel: form + results stacked vertically */}
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
                {/* Form — full view when idle, compact summary bar when results are shown */}
                <RouteForm
                    form={form}
                    loading={loading}
                    stage={stage}
                    stages={stages}
                    error={error}
                    isFormValid={isFormValid()}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    onReset={handleReset}
                    onEdit={handleEdit}
                    onBackToRoutes={handleBackToRoutes}
                    hasSavedRoutes={savedRoutes.length > 0}
                    onValidLocationSelected={() => setLocationSelected(true)}
                    onLocationSelected={handleLocationSelected}
                    compact={hasResults}
                />

                {/* Results — expand below the compact form bar */}
                {hasResults && (
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
                            onFocusPOI={setFocusedPOI}
                            loading={loading}
                            currentRoute={currentRoute}
                        />
                    </Box>
                )}
            </Box>

            {/* Map */}
            <Box sx={{ flexGrow: 1, minWidth: 0, height: "100%", position: "relative" }}>
                <MapViewer
                    pois={pois}
                    focusedPOI={focusedPOI}
                    routeFeature={currentRouteFeature}
                />

                {/* Empty-state overlay */}
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
        </Box>
    );
}

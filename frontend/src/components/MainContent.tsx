import { useTheme, Box, Typography } from "@mui/material";
import ExploreIcon from "@mui/icons-material/Explore";
import RouteForm from "./RouteForm";
import MapViewer from "./MapViewer";
import { useRouteGenerator } from "../hooks/useRouteGenerator";
import RouteSidebar from "./RouteSidebar";

export default function MainContent() {
    const {
        form,
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
        setLocationSelected,
    } = useRouteGenerator();

    const theme = useTheme();
    const hasResults = pois.length > 0;

    return (
        <Box sx={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
            {/* Form panel */}
            <Box
                sx={{
                    width: 380,
                    minWidth: 380,
                    flexShrink: 0,
                    height: "100%",
                    overflowY: "auto",
                    bgcolor: "background.paper",
                    borderRight: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
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
                    onValidLocationSelected={() => setLocationSelected(true)}
                />
            </Box>

            {/* Results panel */}
            {hasResults && (
                <Box
                    sx={{
                        width: 360,
                        minWidth: 360,
                        flexShrink: 0,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        bgcolor: "background.default",
                        borderRight: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <RouteSidebar
                        routesCount={routes.length}
                        selectedIndex={selectedIndex}
                        onSelectRoute={setSelectedIndex}
                        pois={pois}
                        onFocusPOI={setFocusedPOI}
                    />
                </Box>
            )}

            {/* Map */}
            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    height: "100%",
                    position: "relative",
                }}
            >
                <MapViewer
                    pois={pois}
                    focusedPOI={focusedPOI}
                    routeFeature={currentRouteFeature}
                />

                {/* Empty-state overlay when no results yet */}
                {!hasResults && !loading && (
                    <Box
                        sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                            gap: 1.5,
                            pb: "10%",
                        }}
                    >
                        <Box
                            sx={{
                                bgcolor: "background.paper",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                                px: 4,
                                py: 3,
                                textAlign: "center",
                                boxShadow: 3,
                                maxWidth: 280,
                            }}
                        >
                            <ExploreIcon
                                sx={{ fontSize: 40, color: "primary.main", mb: 1.5, opacity: 0.85 }}
                            />
                            <Typography
                                variant="subtitle1"
                                fontWeight={600}
                                sx={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
                            >
                                Plan your trip
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Fill in your destination and interests, then hit Generate.
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

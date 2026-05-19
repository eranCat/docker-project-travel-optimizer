import { useTheme, Box, Typography, Slide } from "@mui/material";
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

    const showSidebar = pois.length > 0 || loading;

    return (
        <Box sx={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
            {/* Form panel */}
            <Box
                sx={{
                    width: 340,
                    minWidth: 340,
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

            {/* Results panel — slides in when loading starts or results arrive */}
            <Slide direction="right" in={showSidebar} mountOnEnter unmountOnExit timeout={300}>
                <Box
                    sx={{
                        width: 320,
                        minWidth: 320,
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
                        focusedPOI={focusedPOI}
                        onFocusPOI={setFocusedPOI}
                        loading={loading}
                    />
                </Box>
            </Slide>

            {/* Map */}
            <Box sx={{ flexGrow: 1, minWidth: 0, height: "100%", position: "relative" }}>
                <MapViewer
                    pois={pois}
                    focusedPOI={focusedPOI}
                    routeFeature={currentRouteFeature}
                />

                {/* Empty-state overlay */}
                {!showSidebar && (
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

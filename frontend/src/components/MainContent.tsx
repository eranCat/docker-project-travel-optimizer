import { useTheme, Box } from "@mui/material";
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

    return (
        <Box
            sx={{
                display: "flex",
                height: "100%",
                width: "100%",
                overflow: "hidden",
            }}
        >
            {/* Left column: RouteForm */}
            <Box
                sx={{
                    width: 400,
                    minWidth: 400,
                    flexShrink: 0,
                    overflowY: "auto",
                    p: 2,
                    backgroundColor: theme.palette.background.default,
                    borderRight: `1px solid ${theme.palette.divider}`,
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

            {/* Middle column: Dropdown + POI list */}

            {pois.length > 0 &&
                <Box
                    sx={{
                        width: { xs: '100%', sm: 400 },
                        minWidth: { xs: '100%', sm: 400 },
                        flexShrink: 0,
                        height: "100%",
                        display: "flex",
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
            }

            {/* Right column: Map */}
            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    height: "100%",
                }}
            >
                <MapViewer
                    pois={pois}
                    focusedPOI={focusedPOI}
                    routeFeature={currentRouteFeature}
                />
            </Box>
        </Box>

    );
}

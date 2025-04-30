import React from "react";
import { Box } from "@mui/material";
import RouteForm from "./RouteForm";
import AlertMessage from "./AlertMessage";
import LoadingProgress from "./LoadingProgress";
import RouteSidebar from "./RouteSidebar";
import MapViewer from "./MapViewer";
import { useRouteGenerator } from "../hooks/useRouteGenerator";

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

    return (
        <>
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

            <LoadingProgress loading={loading} stages={stages} stage={stage} />
            <AlertMessage message={error} />

            <Box
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    gap: 2,
                    mt: 2,
                    height: { xs: "auto", sm: 500 },
                }}
            >
                <RouteSidebar
                    routesCount={routes.length}
                    selectedIndex={selectedIndex}
                    onSelectRoute={setSelectedIndex}
                    pois={pois}
                    onFocusPOI={setFocusedPOI}
                />
                <Box sx={{ height: { xs: 300, sm: '100%' }, width: { xs: '100%', sm: '50%' } }}>
                    <MapViewer
                        pois={pois}
                        focusedPOI={focusedPOI}
                        routeFeature={currentRouteFeature}
                    />
                </Box>
            </Box>
        </>
    );
}

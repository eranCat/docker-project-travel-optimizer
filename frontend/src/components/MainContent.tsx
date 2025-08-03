import React from 'react';
import {
    useTheme,
    Box,
    Drawer,
    useMediaQuery,
    Fab,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import RouteForm from './RouteForm';
import MapViewer from './MapViewer';
import { useRouteGenerator } from '../hooks/useRouteGenerator';
import RouteSidebar from './RouteSidebar';

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
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const sidebarContent = (
        <Box sx={{ p: 2, width: 300 }}>
            {pois.length > 0 ? (
                <RouteSidebar
                    routesCount={routes.length}
                    selectedIndex={selectedIndex}
                    onSelectRoute={setSelectedIndex}
                    pois={pois}
                    onFocusPOI={setFocusedPOI}
                    onReset={handleReset}
                />
            ) : (
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
            )}
        </Box>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                height: '100vh',
                width: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Sidebar on desktop */}
            {isDesktop ? (
                <Box
                    sx={{
                        width: 400,
                        minWidth: 400,
                        height: '100vh',
                        flexShrink: 0,
                        overflow: 'auto',
                        borderRight: `1px solid ${theme.palette.divider}`,
                        backgroundColor: theme.palette.background.default,
                    }}
                >
                    {sidebarContent}
                </Box>
            ) : (
                <>
                    {/* Drawer on mobile */}
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={() => setMobileOpen(false)}
                        ModalProps={{ keepMounted: true }}
                        PaperProps={{ sx: { width: 300 } }}
                    >
                        {sidebarContent}
                    </Drawer>

                    {/* Floating button to open drawer */}
                    <Fab
                        color="primary"
                        onClick={() => setMobileOpen(true)}
                        sx={{ position: 'fixed', top: 80, left: 16, zIndex: 1300 }}
                    >
                        <MenuIcon />
                    </Fab>
                </>
            )}

            {/* Map Viewer */}
            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    height: '100%',
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
import { useTheme, Box } from '@mui/material';
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

    return (
        <Box
            sx={{
                width: { xs: '100%', md: 400 },
                minWidth: { xs: '100%', md: 400 },
                height: { xs: '50vh', md: '100vh' },
                maxHeight: '100vh',
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                backgroundColor: theme.palette.background.default,
                borderRight: { md: `1px solid ${theme.palette.divider}` },
                borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
            }}
        >
            {/* Top half on mobile: Conditionally render Form or Sidebar */}
            <Box sx={{ overflowY: 'auto', p: 2, flex: 1 }}>
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

            {/* Bottom half on mobile: Map */}
            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    height: { xs: '50vh', md: '100%' },
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
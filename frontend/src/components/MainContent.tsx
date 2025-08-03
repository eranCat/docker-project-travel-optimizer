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
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                height: '100vh',
                width: '100%',
                overflow: 'hidden',
            }}
        >
            {/* Top half on mobile: Conditionally render Form or Sidebar */}
            <Box
                sx={{
                    width: { xs: '100%', md: 400 },
                    minWidth: { xs: '100%', md: 400 },
                    height: { xs: '50vh', md: '100%' },
                    flexShrink: 0,
                    overflowY: 'auto',
                    p: 2,
                    backgroundColor: theme.palette.background.default,
                    borderRight: { md: `1px solid ${theme.palette.divider}` },
                    borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                }}
            >
                {pois.length > 0 ? (
                    <RouteSidebar
                        routesCount={routes.length}
                        selectedIndex={selectedIndex}
                        onSelectRoute={setSelectedIndex}
                        pois={pois}
                        onFocusPOI={setFocusedPOI}
                        onReset={handleReset} // The onReset prop is correctly passed here
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
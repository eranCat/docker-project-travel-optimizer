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
                height: '100vh', // Ensure the main container takes up the full viewport height
                width: '100%',
                overflow: 'hidden', // Prevents body scroll
            }}
        >
            {/* Top half on mobile: RouteForm and RouteSidebar */}
            {/* This box now has a fixed height on mobile and is scrollable */}
            <Box
                sx={{
                    width: { xs: '100%', md: 400 },
                    minWidth: { xs: '100%', md: 400 },
                    height: { xs: '50vh', md: '100%' }, // Fixed 50% height on mobile
                    flexShrink: 0,
                    overflowY: 'auto', // Enable scrolling for the form/sidebar section
                    p: 2,
                    backgroundColor: theme.palette.background.default,
                    borderRight: { md: `1px solid ${theme.palette.divider}` },
                    borderBottom: { xs: `1px solid ${theme.palette.divider}`, md: 'none' },
                    display: 'flex',
                    flexDirection: 'column',
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
                {pois.length > 0 && (
                    <Box
                        sx={{
                            borderTop: '1px solid',
                            borderColor: theme.palette.divider,
                            mt: 2,
                            pt: 2,
                            flexShrink: 0, // Prevents sidebar from shrinking
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
            </Box>

            {/* Bottom half on mobile: Map */}
            {/* This box also has a fixed height on mobile */}
            <Box
                sx={{
                    flexGrow: 1,
                    minWidth: 0,
                    height: { xs: '50vh', md: '100%' }, // Fixed 50% height on mobile
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
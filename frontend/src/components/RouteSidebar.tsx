import { Box, Paper, useTheme } from "@mui/material";
import RouteSelector from "./RouteSelector";
import POIList from "./POIList";
import { POI } from "../models/POI";

interface RouteSidebarProps {
    routesCount: number;
    selectedIndex: number;
    onSelectRoute: (index: number) => void;
    pois: POI[];
    onFocusPOI: (poi: POI) => void;
}

export default function RouteSidebar({
    routesCount,
    selectedIndex,
    onSelectRoute,
    pois,
    onFocusPOI,
}: RouteSidebarProps) {
    const theme = useTheme();

    return (
        <Paper
            sx={{
                display: "flex",
                flexDirection: "column",
                flexGrow: 1,
                m: 2,
                overflow: "hidden",
                minHeight: 0,
                backgroundColor: theme.palette.background.paper,
                borderRadius: 2,
                boxShadow: theme.shadows[2],
            }}
        >
            {/* Header: Route dropdown */}
            <Box
                sx={{
                    px: 2,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    flexShrink: 0,
                }}
            >
                {routesCount > 0 && (
                    <RouteSelector
                        selectedIndex={selectedIndex}
                        routeCount={routesCount}
                        onSelect={onSelectRoute}
                    />
                )}
            </Box>

            {/* Scrollable content (POI list) */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    px: 2,
                    minHeight: 0,
                }}
            >
                <POIList pois={pois} onFocusPOI={onFocusPOI} />
            </Box>
        </Paper>
    );
}

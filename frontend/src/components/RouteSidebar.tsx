import { Box, Paper } from "@mui/material";
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
    return (
        <Paper
            sx={{
                flex: 2,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    px: 2,
                    py: 1,
                    borderBottom: "1px solid",
                    borderColor: "divider",
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
            <Box sx={{ flex: 1, overflowY: "auto", px: 2 }}>
                <POIList pois={pois} onFocusPOI={onFocusPOI} />
            </Box>
        </Paper>
    );
}

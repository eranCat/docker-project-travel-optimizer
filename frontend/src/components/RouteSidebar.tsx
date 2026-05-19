import { Box, Typography } from "@mui/material";
import RouteSelector from "./RouteSelector";
import POIList from "./POIList";
import { POI } from "../models/POI";
import PlaceIcon from "@mui/icons-material/Place";

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
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    flexShrink: 0,
                    px: 2,
                    pt: 2,
                    pb: 0,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
                    <PlaceIcon sx={{ color: "primary.main", fontSize: 20 }} />
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        sx={{ fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
                    >
                        {pois.length} stops found
                    </Typography>
                </Box>
                <RouteSelector
                    selectedIndex={selectedIndex}
                    routeCount={routesCount}
                    onSelect={onSelectRoute}
                />
            </Box>

            {/* Scrollable POI list */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: "auto",
                    px: 1.5,
                    py: 1.5,
                    minHeight: 0,
                }}
            >
                <POIList pois={pois} onFocusPOI={onFocusPOI} />
            </Box>
        </Box>
    );
}

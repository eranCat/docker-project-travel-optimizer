import { Box, Typography, Fade } from "@mui/material";
import RouteSelector from "./RouteSelector";
import POIList from "./POIList";
import POISkeleton from "./POISkeleton";
import { POI } from "../models/POI";
import PlaceIcon from "@mui/icons-material/Place";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface RouteSidebarProps {
    routesCount: number;
    selectedIndex: number;
    onSelectRoute: (index: number) => void;
    pois: POI[];
    focusedPOI: POI | null;
    onFocusPOI: (poi: POI) => void;
    loading: boolean;
}

export default function RouteSidebar({
    routesCount,
    selectedIndex,
    onSelectRoute,
    pois,
    focusedPOI,
    onFocusPOI,
    loading,
}: RouteSidebarProps) {
    const showSkeleton = loading && pois.length === 0;

    return (
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
            {/* Header */}
            <Box
                sx={{
                    flexShrink: 0,
                    px: 2,
                    pt: 1.75,
                    pb: 0,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
                    {loading ? (
                        <AutoAwesomeIcon
                            sx={{
                                color: "primary.main",
                                fontSize: 18,
                                animation: "spin 1.5s linear infinite",
                                "@keyframes spin": {
                                    from: { transform: "rotate(0deg)" },
                                    to: { transform: "rotate(360deg)" },
                                },
                            }}
                        />
                    ) : (
                        <PlaceIcon sx={{ color: "primary.main", fontSize: 18 }} />
                    )}
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color={loading ? "text.secondary" : "text.primary"}
                        sx={{ fontFamily: '"Space Grotesk", "Inter", sans-serif', fontSize: "0.875rem" }}
                    >
                        {loading
                            ? "Generating route…"
                            : `${pois.length} stop${pois.length !== 1 ? "s" : ""} found`}
                    </Typography>
                </Box>

                {!loading && (
                    <RouteSelector
                        selectedIndex={selectedIndex}
                        routeCount={routesCount}
                        onSelect={onSelectRoute}
                    />
                )}
            </Box>

            {/* Content */}
            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 1.5, minHeight: 0 }}>
                {showSkeleton ? (
                    <POISkeleton count={4} />
                ) : (
                    <Fade in={pois.length > 0} timeout={400}>
                        <div>
                            <POIList pois={pois} focusedPOI={focusedPOI} onFocusPOI={onFocusPOI} />
                        </div>
                    </Fade>
                )}
            </Box>
        </Box>
    );
}

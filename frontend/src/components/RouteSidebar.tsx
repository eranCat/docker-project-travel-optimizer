import { Box, Typography, Fade, Chip, IconButton, Tooltip, Tabs, Tab } from "@mui/material";
import { useTranslation } from "react-i18next";
import RouteSelector from "./RouteSelector";
import POIList from "./POIList";
import POISkeleton from "./POISkeleton";
import LoadingProgress from "./LoadingProgress";
import { POI } from "../models/POI";
import { RouteData } from "../models/RouteData";
import PlaceIcon from "@mui/icons-material/Place";
import LoopIcon from "@mui/icons-material/Loop";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MapIcon from "@mui/icons-material/Map";
import ShareIcon from "@mui/icons-material/Share";
import { buildGoogleMapsUrl } from "../utils/googleMapsUrl";

interface RouteSidebarProps {
    routesCount: number;
    selectedIndex: number;
    onSelectRoute: (index: number) => void;
    pois: POI[];
    focusedPOI: POI | null;
    onFocusPOI: (poi: POI) => void;
    loading: boolean;
    currentRoute?: RouteData | null;
    onShareRoute?: () => void;
    onReplacePOI?: (idx: number) => void;
    replacingPoiIndex?: number | null;
    numDays?: number;
    stage?: number;
    stages?: string[];
    detail?: { tags?: number; pois?: number; routes?: number };
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function RouteSidebar({
    routesCount,
    selectedIndex,
    onSelectRoute,
    pois,
    focusedPOI,
    onFocusPOI,
    loading,
    currentRoute,
    onShareRoute,
    onReplacePOI,
    replacingPoiIndex = null,
    numDays = 1,
    stage = 0,
    stages = [],
    detail,
}: RouteSidebarProps) {
    const { t } = useTranslation();
    const showSkeleton = loading && pois.length === 0;
    const routesPerDay = numDays > 1 ? Math.ceil(routesCount / numDays) : routesCount;
    const currentDay = numDays > 1 ? Math.floor(selectedIndex / routesPerDay) : 0;
    const dayRouteOffset = currentDay * routesPerDay;
    const dayRouteCount = Math.min(routesPerDay, routesCount - dayRouteOffset);
    const handleDayChange = (_: React.SyntheticEvent, day: number) => { onSelectRoute(day * routesPerDay); };
    const handleRouteInDay = (idxInDay: number) => { onSelectRoute(dayRouteOffset + idxInDay); };
    const selectedInDay = selectedIndex - dayRouteOffset;
    const hasDuration = currentRoute?.duration_seconds != null && currentRoute.duration_seconds > 0;
    const vibe = currentRoute?.vibe;
    const gmapsUrl = pois.length > 0 ? buildGoogleMapsUrl(pois) : null;

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
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
                    {loading ? (
                        <LoopIcon
                            sx={{
                                color: "primary.main",
                                fontSize: 18,
                                animation: "spin 1.2s linear infinite",
                                "@keyframes spin": {
                                    from: { transform: "rotate(360deg)" },
                                    to: { transform: "rotate(0deg)" },
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
                        sx={{ fontFamily: '"Space Grotesk", "Inter", sans-serif', fontSize: "0.875rem", flexGrow: 1 }}
                    >
                        {loading
                            ? t("sidebar.generating")
                            : t("sidebar.stopsFound", { count: pois.length })}
                    </Typography>

                    {!loading && (gmapsUrl || onShareRoute) && (
                        <Box sx={{ display: "flex", gap: 0.25 }}>
                            {gmapsUrl && (
                                <Tooltip title={t("sidebar.googleMaps")}>
                                    <IconButton
                                        size="small"
                                        component="a"
                                        href={gmapsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}
                                    >
                                        <MapIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                            {onShareRoute && (
                                <Tooltip title={t("sidebar.share")}>
                                    <IconButton
                                        size="small"
                                        onClick={onShareRoute}
                                        sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}
                                    >
                                        <ShareIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    )}
                </Box>

                {!loading && (vibe || hasDuration) && (
                    <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 0.75 }}>
                        {vibe && (
                            <Chip
                                size="small"
                                label={t(`vibe.${vibe}`, { defaultValue: vibe })}
                                sx={{ height: 18, fontSize: "0.65rem", bgcolor: "primary.main", color: "#fff", "& .MuiChip-label": { px: 0.75 } }}
                            />
                        )}
                        {hasDuration && (
                            <Chip
                                size="small"
                                icon={<AccessTimeIcon sx={{ fontSize: "0.65rem !important", ml: "4px !important" }} />}
                                label={formatDuration(currentRoute!.duration_seconds!)}
                                variant="outlined"
                                sx={{ height: 18, fontSize: "0.65rem", "& .MuiChip-label": { px: 0.5 } }}
                            />
                        )}
                    </Box>
                )}

                {!loading && numDays > 1 && routesCount > 0 && (
                    <Tabs
                        value={currentDay}
                        onChange={handleDayChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ minHeight: 32, mb: 0.5, "& .MuiTab-root": { minHeight: 32, py: 0, fontSize: "0.75rem" } }}
                    >
                        {Array.from({ length: numDays }, (_, i) => (
                            <Tab key={i} label={t("sidebar.day", { n: i + 1 })} value={i}
                                disabled={i * routesPerDay >= routesCount} />
                        ))}
                    </Tabs>
                )}

                {!loading && (
                    <RouteSelector
                        selectedIndex={selectedInDay}
                        routeCount={dayRouteCount}
                        onSelect={handleRouteInDay}
                    />
                )}
            </Box>

            {/* Content */}
            <Box sx={{ flexGrow: 1, overflowY: "auto", px: 1.5, py: 1.5, minHeight: 0 }}>
                {showSkeleton ? (
                    <>
                        <LoadingProgress loading={loading} stages={stages} stage={stage} detail={detail} />
                        <POISkeleton count={3} />
                    </>
                ) : (
                    <Fade in={pois.length > 0} timeout={400}>
                        <div>
                            <POIList
                                pois={pois}
                                focusedPOI={focusedPOI}
                                onFocusPOI={onFocusPOI}
                                onReplacePOI={onReplacePOI ?? (() => {})}
                                replacingPoiIndex={replacingPoiIndex}
                            />
                        </div>
                    </Fade>
                )}
            </Box>
        </Box>
    );
}

import React, { useEffect, useRef } from "react";
import { POI } from "../models/POI";
import {
    Box,
    Chip,
    IconButton,
    Typography,
    Tooltip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaceIcon from "@mui/icons-material/Place";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccessibleIcon from "@mui/icons-material/Accessible";
import { CATEGORY_ICONS, CATEGORY_COLORS, DARK_CATEGORY_COLORS } from "../styles/icons";
import { useTheme } from "@mui/material";
import { detectDirectionFromText } from "../utils/detectDirectionFromText";
import { createSearchQuery } from "../utils/createSearchQuery";

interface POIListProps {
    pois: POI[];
    focusedPOI: POI | null;
    onFocusPOI: (poi: POI) => void;
}

function isSamePOI(a: POI | null, b: POI): boolean {
    return !!a && a.latitude === b.latitude && a.longitude === b.longitude;
}

export default function POIList({ pois, focusedPOI, onFocusPOI }: POIListProps) {
    const activeRef = useRef<HTMLDivElement | null>(null);
    const theme = useTheme();
    const colorMap = theme.palette.mode === "dark" ? CATEGORY_COLORS : DARK_CATEGORY_COLORS;

    // Scroll active card into view when focusedPOI changes
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [focusedPOI]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {pois.map((poi, idx) => {
                const canFocus = Number.isFinite(poi.latitude) && Number.isFinite(poi.longitude);
                const isActive = isSamePOI(focusedPOI, poi);
                const catKey = poi.categories?.[0]?.toLowerCase() ?? "default";
                const accentColor = colorMap[catKey] || colorMap["default"];

                return (
                    <Box
                        key={idx}
                        ref={isActive ? activeRef : undefined}
                        sx={{
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: isActive ? "primary.main" : "divider",
                            borderRadius: 2,
                            p: 0.75,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.4,
                            cursor: canFocus ? "pointer" : "default",
                            boxShadow: isActive ? 4 : 1,
                            outline: isActive ? (t: any) => `2px solid ${t.palette.primary.main}` : "none",
                            outlineOffset: -1,
                            transition: "box-shadow 200ms ease, border-color 200ms ease",
                            "&:hover": canFocus ? {
                                boxShadow: 4,
                                borderColor: "primary.main",
                            } : {},
                        }}
                        onClick={() => canFocus && onFocusPOI(poi)}
                        role={canFocus ? "button" : undefined}
                        tabIndex={canFocus ? 0 : undefined}
                        onKeyDown={(e) => {
                            if (canFocus && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                onFocusPOI(poi);
                            }
                        }}
                        aria-pressed={isActive}
                    >
                        {/* Step number + name + map icon */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Box
                                sx={{
                                    flexShrink: 0,
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    bgcolor: isActive ? "primary.main" : accentColor,
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.65rem",
                                    fontWeight: 700,
                                    boxShadow: isActive ? `0 0 0 3px rgba(15,118,110,0.25)` : "none",
                                    transition: "background-color 200ms ease, box-shadow 200ms ease",
                                }}
                            >
                                {idx + 1}
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    component="a"
                                    href={createSearchQuery(poi)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    variant="subtitle2"
                                    fontWeight={600}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{
                                        color: isActive ? "primary.main" : "text.primary",
                                        textDecoration: "none",
                                        lineHeight: 1.3,
                                        direction: detectDirectionFromText(poi.name),
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.4,
                                        "&:hover": { color: "primary.main", textDecoration: "underline" },
                                        transition: "color 150ms ease",
                                    }}
                                >
                                    {poi.name}
                                    <OpenInNewIcon sx={{ fontSize: 11, opacity: 0.5, flexShrink: 0 }} />
                                </Typography>
                            </Box>

                            <Tooltip title={canFocus ? "Show on map" : "No coordinates"}>
                                <span>
                                    <IconButton
                                        size="small"
                                        color={isActive ? "primary" : "default"}
                                        disabled={!canFocus}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFocusPOI(poi);
                                        }}
                                        sx={{
                                            p: 0.5,
                                            color: isActive ? "primary.main" : "text.disabled",
                                            transition: "color 150ms ease",
                                            "&:hover": { color: "primary.main" },
                                        }}
                                    >
                                        <MyLocationIcon sx={{ fontSize: 14 }} />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>

                        {/* Address + opening hours + wheelchair + chips */}
                        {(poi.address || poi.opening_hours || poi.wheelchair_accessible || (Array.isArray(poi.categories) && poi.categories.length > 0)) && (
                            <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5, pl: "26px" }}>
                                {poi.address && (
                                    <>
                                        <PlaceIcon sx={{ fontSize: 10, color: "text.disabled", flexShrink: 0 }} />
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ direction: detectDirectionFromText(poi.address), lineHeight: 1.4, mr: 0.5 }}
                                        >
                                            {poi.address}
                                        </Typography>
                                    </>
                                )}
                                {poi.opening_hours && (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, width: "100%" }}>
                                        <AccessTimeIcon sx={{ fontSize: 10, color: "text.disabled", flexShrink: 0 }} />
                                        <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.4, fontStyle: "italic" }}>
                                            {poi.opening_hours}
                                        </Typography>
                                    </Box>
                                )}
                                {poi.wheelchair_accessible && (
                                    <Tooltip title="Wheelchair accessible">
                                        <AccessibleIcon sx={{ fontSize: 12, color: "success.main" }} />
                                    </Tooltip>
                                )}
                                {Array.isArray(poi.categories) && poi.categories.map((cat, i) => {
                                    const iconClass = CATEGORY_ICONS[cat.toLowerCase()] || CATEGORY_ICONS.default;
                                    return (
                                        <Chip
                                            key={i}
                                            size="small"
                                            label={
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                                                    <i className={`fas ${iconClass}`} style={{ fontSize: "0.65rem" }} />
                                                    {cat}
                                                </Box>
                                            }
                                            sx={{
                                                height: 16,
                                                fontSize: "0.65rem",
                                                bgcolor: isActive ? "primary.main" : accentColor,
                                                color: "#fff",
                                                opacity: 0.9,
                                                transition: "background-color 200ms ease",
                                                "& .MuiChip-label": { px: 0.75 },
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

import React, { useEffect, useRef } from "react";
import { POI } from "../models/POI";
import {
    Box,
    Button,
    Chip,
    Typography,
    Tooltip,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlaceIcon from "@mui/icons-material/Place";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "../styles/icons";
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

    // Scroll active card into view when focusedPOI changes
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [focusedPOI]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pois.map((poi, idx) => {
                const canFocus = Number.isFinite(poi.latitude) && Number.isFinite(poi.longitude);
                const isActive = isSamePOI(focusedPOI, poi);
                const catKey = poi.categories?.[0]?.toLowerCase() ?? "default";
                const accentColor = CATEGORY_COLORS[catKey] || CATEGORY_COLORS["default"];

                return (
                    <Box
                        key={idx}
                        ref={isActive ? activeRef : undefined}
                        sx={{
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: isActive ? "primary.main" : "divider",
                            borderRadius: 3,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
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
                        {/* Step number + name */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box
                                sx={{
                                    flexShrink: 0,
                                    width: 26,
                                    height: 26,
                                    borderRadius: "50%",
                                    bgcolor: isActive ? "primary.main" : accentColor,
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    mt: "1px",
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
                                        lineHeight: 1.35,
                                        direction: detectDirectionFromText(poi.name),
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 0.4,
                                        "&:hover": { color: "primary.main", textDecoration: "underline" },
                                        transition: "color 150ms ease",
                                    }}
                                >
                                    {poi.name}
                                    <OpenInNewIcon sx={{ fontSize: 12, opacity: 0.5, flexShrink: 0 }} />
                                </Typography>
                            </Box>
                        </Box>

                        {/* Address */}
                        {poi.address && (
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.5, pl: "34px" }}>
                                <PlaceIcon sx={{ fontSize: 13, color: "text.disabled", mt: "2px", flexShrink: 0 }} />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ direction: detectDirectionFromText(poi.address), lineHeight: 1.5 }}
                                >
                                    {poi.address}
                                </Typography>
                            </Box>
                        )}

                        {/* Category chips */}
                        {Array.isArray(poi.categories) && poi.categories.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, pl: "34px" }}>
                                {poi.categories.map((cat, i) => {
                                    const iconClass = CATEGORY_ICONS[cat.toLowerCase()] || CATEGORY_ICONS.default;
                                    return (
                                        <Chip
                                            key={i}
                                            size="small"
                                            label={
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                                    <i className={`fas ${iconClass}`} style={{ fontSize: "0.7rem" }} />
                                                    {cat}
                                                </Box>
                                            }
                                            sx={{
                                                height: 22,
                                                fontSize: "0.75rem",
                                                bgcolor: isActive ? "primary.main" : accentColor,
                                                color: "#fff",
                                                opacity: 0.9,
                                                transition: "background-color 200ms ease",
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        )}

                        {/* Show on map button */}
                        <Box sx={{ pl: "34px", mt: 0.25 }}>
                            <Tooltip title={canFocus ? "Click card or use button to focus map" : "No coordinates"}>
                                <span>
                                    <Button
                                        variant={isActive ? "contained" : "outlined"}
                                        size="small"
                                        color="primary"
                                        disabled={!canFocus}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFocusPOI(poi);
                                        }}
                                        startIcon={<MyLocationIcon fontSize="small" />}
                                        sx={{
                                            borderRadius: 20,
                                            fontSize: "0.75rem",
                                            py: 0.4,
                                            px: 1.5,
                                            minHeight: 32,
                                            transition: "all 150ms ease",
                                        }}
                                    >
                                        {isActive ? "Focused" : "Show on map"}
                                    </Button>
                                </span>
                            </Tooltip>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

import React from "react";
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
import { CATEGORY_ICONS } from "../styles/icons";
import { detectDirectionFromText } from "../utils/detectDirectionFromText";
import { createSearchQuery } from "../utils/createSearchQuery";

interface POIListProps {
    pois: POI[];
    onFocusPOI: (poi: POI) => void;
}

export default function POIList({ pois, onFocusPOI }: POIListProps) {
    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pois.map((poi, idx) => {
                const canFocus = Number.isFinite(poi.latitude) && Number.isFinite(poi.longitude);

                return (
                    <Box
                        key={idx}
                        sx={{
                            bgcolor: "background.paper",
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                            p: 2,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                            transition: "box-shadow 150ms ease, border-color 150ms ease",
                            "&:hover": {
                                boxShadow: 3,
                                borderColor: "primary.main",
                            },
                        }}
                    >
                        {/* Step number + name */}
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Box
                                sx={{
                                    flexShrink: 0,
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    mt: 0.25,
                                }}
                            >
                                {idx + 1}
                            </Box>
                            <Typography
                                component="a"
                                href={createSearchQuery(poi)}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="subtitle2"
                                fontWeight={600}
                                sx={{
                                    color: "text.primary",
                                    textDecoration: "none",
                                    lineHeight: 1.35,
                                    direction: detectDirectionFromText(poi.name),
                                    "&:hover": { color: "primary.main" },
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 0.5,
                                    flexWrap: "wrap",
                                }}
                            >
                                {poi.name}
                                <OpenInNewIcon sx={{ fontSize: 13, opacity: 0.55, flexShrink: 0 }} />
                            </Typography>
                        </Box>

                        {/* Description */}
                        {poi.description && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    fontSize: "0.8125rem",
                                    lineHeight: 1.5,
                                    direction: detectDirectionFromText(poi.description),
                                    pl: "32px",
                                }}
                            >
                                {poi.description}
                            </Typography>
                        )}

                        {/* Address */}
                        {poi.address && (
                            <Box
                                sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 0.5,
                                    pl: "32px",
                                }}
                            >
                                <PlaceIcon sx={{ fontSize: 14, color: "text.disabled", mt: "2px", flexShrink: 0 }} />
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ direction: detectDirectionFromText(poi.address), lineHeight: 1.45 }}
                                >
                                    {poi.address}
                                </Typography>
                            </Box>
                        )}

                        {/* Category chips */}
                        {Array.isArray(poi.categories) && poi.categories.length > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.75,
                                    pl: "32px",
                                }}
                            >
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
                                                bgcolor: "primary.main",
                                                color: "primary.contrastText",
                                                opacity: 0.85,
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        )}

                        {/* Show on map */}
                        <Box sx={{ pl: "32px", mt: 0.5 }}>
                            <Tooltip title={canFocus ? "Pan map to this location" : "Coordinates not available"}>
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        disabled={!canFocus}
                                        onClick={() => onFocusPOI(poi)}
                                        startIcon={<MyLocationIcon fontSize="small" />}
                                        sx={{
                                            borderRadius: 20,
                                            fontSize: "0.75rem",
                                            py: 0.5,
                                            px: 1.5,
                                            minHeight: 32,
                                        }}
                                    >
                                        Show on map
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

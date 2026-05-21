import React from "react";
import { POI } from "../models/POI";
import { List, ListItem, ListItemText, Box, Button, Divider, Typography, useTheme } from "@mui/material";
import { CATEGORY_ICONS } from "../styles/icons";
import { detectDirectionFromText } from "../utils/detectDirectionFromText";
import { createSearchQuery } from "../utils/createSearchQuery";

interface POIListProps {
    pois: POI[];
    onFocusPOI: (poi: POI) => void;
}

export default function POIList({ pois, onFocusPOI }: POIListProps) {

    const theme = useTheme();

    return (
        <List dense>
            {pois.map((poi, idx) => (
                <React.Fragment key={idx}>
                    <ListItem
                        alignItems="flex-start"
                        disableGutters
                        sx={{
                            mb: 2,
                            p: 2.5,
                            borderRadius: 3,
                            backgroundColor: theme.palette.background.paper,
                            color: theme.palette.text.primary,
                            boxShadow: 1,
                            border: `1px solid ${theme.palette.divider}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1.5,
                        }}
                    >
                        {/* POI Title (Link to external search) */}
                        <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{
                                color: theme.palette.text.primary,
                                textDecoration: "none",
                                direction: detectDirectionFromText(poi.name),
                            }}
                            component="a"
                            href={createSearchQuery(poi)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {poi.name}
                        </Typography>

                        {/* Optional description */}
                        {poi.description && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "text.secondary",
                                    fontSize: "0.875rem",
                                    direction: detectDirectionFromText(poi.description),
                                }}
                            >
                                {poi.description}
                            </Typography>
                        )}

                        {/* Address */}
                        {poi.address && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: "0.875rem",
                                    direction: detectDirectionFromText(poi.address),
                                }}
                            >
                                📍 {poi.address}
                            </Typography>
                        )}

                        {/* Categories with icons */}
                        {Array.isArray(poi.categories) && poi.categories.length > 0 && (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    gap: 1,
                                    fontSize: "0.875rem",
                                    color: "text.secondary",
                                    mt: 0.5,
                                }}
                            >
                                <strong>Category:</strong>
                                {poi.categories.map((cat, idx) => {
                                    const iconClass = CATEGORY_ICONS[cat.toLowerCase()] || "fa-map-pin";
                                    return (
                                        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                            <i className={`fas ${iconClass}`} style={{ fontSize: "1rem" }} />
                                            <span>{cat}</span>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}

                        {/* CTA Button */}
                        <Box sx={{ textAlign: "right", mt: 1 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    if (Number.isFinite(poi.latitude) && Number.isFinite(poi.longitude)) {
                                        onFocusPOI(poi);
                                    }
                                }}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 500,
                                    borderRadius: 2,
                                    px: 2,
                                }}
                            >
                                Show on Map
                            </Button>
                        </Box>
                    </ListItem>
                </React.Fragment>
            ))}
        </List>
    );
}

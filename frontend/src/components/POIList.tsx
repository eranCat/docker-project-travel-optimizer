import React from "react";
import { POI } from "../models/POI";
import { List, ListItem, ListItemText, Box, Button, Divider } from "@mui/material";
import { CATEGORY_ICONS } from "../styles/icons";
import { detectDirectionFromText } from "../utils/detectDirectionFromText";
import { createSearchQuery } from "../utils/createSearchQuery";

interface POIListProps {
    pois: POI[];
    onFocusPOI: (poi: POI) => void;
}

export default function POIList({ pois, onFocusPOI }: POIListProps) {
    return (
        <List dense>
            {pois.map((poi, idx) => (
                <React.Fragment key={idx}>
                    <ListItem alignItems="flex-start" disableGutters>
                        <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, flexWrap: "wrap", textAlign: "start" }}>
                            <Box sx={{ flex: 1 }}>
                                <ListItemText
                                    primary={poi.address && (
                                        <a
                                            href={createSearchQuery(poi)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: "block",
                                                marginTop: "0.25rem",
                                                color: "#1976d2",
                                                textDecoration: "none",
                                                direction: detectDirectionFromText(poi.name),
                                                textAlign: "start",
                                            }}
                                        >
                                            {poi.name}
                                        </a>
                                    )}
                                    secondary={
                                        <>
                                            {poi.description && (
                                                <span style={{
                                                    display: "block",
                                                    fontSize: "0.75rem",
                                                    direction: detectDirectionFromText(poi.description),
                                                    textAlign: "start",
                                                }}>
                                                    {poi.description}
                                                </span>
                                            )}
                                            {poi.categories && (
                                                <span style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    color: "gray",
                                                    fontSize: "0.875rem",
                                                    direction: "ltr",
                                                    textAlign: "start",
                                                }}>
                                                    {(poi.categories.length === 1 ? "Category" : "Categories") + " : "}
                                                    {poi.categories.map((cat, idx) => {
                                                        const category = cat.toLowerCase();
                                                        const iconClass = CATEGORY_ICONS[category] || "fa-map-pin";

                                                        return (
                                                            <span key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                                <i className={`fas ${iconClass}`} style={{ fontSize: "1rem" }} />
                                                                {cat}
                                                            </span>
                                                        );
                                                    })}
                                                </span>
                                            )}
                                        </>
                                    }
                                    slotProps={{
                                        primary: { sx: { textAlign: "start" } },
                                        secondary: { sx: { textAlign: "start" } },
                                    }}
                                />
                            </Box>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => { if (Number.isFinite(poi.latitude) && Number.isFinite(poi.longitude)) onFocusPOI(poi); }}
                                sx={{ textTransform: "none", whiteSpace: "nowrap", alignSelf: "center" }}
                            >
                                Show on Map
                            </Button>
                        </Box>
                    </ListItem>
                    <Divider component="li" />
                </React.Fragment>
            ))}
        </List>
    );
}

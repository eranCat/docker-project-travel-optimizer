import React, { useEffect, useState, useRef } from "react";
import {
    TextField,
    List,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Paper,
    Fade,
    Box,
    CircularProgress,
    InputAdornment,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";
import { fetchLocationSuggestions } from "../services/API";

interface Props {
    value: string;
    onChange: (val: string) => void;
    onSelect: (val: string, lat?: number, lon?: number) => void;
}

interface Suggestion {
    display_name: string;
    lat: string;
    lon: string;
}

const LocationAutocomplete: React.FC<Props> = ({ value, onChange, onSelect }) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [fetching, setFetching] = useState(false);
    const [disableFetch, setDisableFetch] = useState(false);
    const firstRenderRef = useRef(true);

    useEffect(() => {
        if (firstRenderRef.current) {
            firstRenderRef.current = false;
            return;
        }

        if (disableFetch) {
            setDisableFetch(false);
            return;
        }

        if (!value || value.trim().length < 3) {
            setSuggestions([]);
            setShowDropdown(false);
            setFetching(false);
            return;
        }

        setFetching(true);
        const controller = new AbortController();
        const delay = setTimeout(() => {
            fetchLocationSuggestions(value, controller.signal)
                .then((res) => {
                    setSuggestions(res);
                    setShowDropdown(true);
                    setHighlightedIndex(-1);
                })
                .catch(() => {})
                .finally(() => setFetching(false));
        }, 300);

        return () => {
            clearTimeout(delay);
            controller.abort();
            setFetching(false);
        };
    }, [value]);

    const handleSelect = (name: string, lat?: number, lon?: number) => {
        onSelect(name, lat, lon);
        setDisableFetch(true);
        setShowDropdown(false);
        setSuggestions([]);
        requestAnimationFrame(() => {
            document.getElementById("location-input")?.blur();
        });
    };

    return (
        <Box sx={{ position: "relative" }}>
            <TextField
                id="location-input"
                name="location"
                label="Location"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (!showDropdown || suggestions.length === 0) return;
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightedIndex((p) => (p + 1) % suggestions.length);
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightedIndex((p) => (p - 1 + suggestions.length) % suggestions.length);
                    } else if (e.key === "Enter" && highlightedIndex >= 0) {
                        e.preventDefault();
                        const s = suggestions[highlightedIndex];
                        handleSelect(s.display_name, parseFloat(s.lat), parseFloat(s.lon));
                        requestAnimationFrame(() => {
                            document.getElementById("location-input")?.focus();
                        });
                    } else if (e.key === "Escape") {
                        setShowDropdown(false);
                    }
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                fullWidth
                placeholder="e.g. Tel Aviv"
                autoComplete="off"
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                            </InputAdornment>
                        ),
                        endAdornment: fetching ? (
                            <InputAdornment position="end">
                                <CircularProgress size={16} />
                            </InputAdornment>
                        ) : undefined,
                    },
                }}
            />

            <Fade in={showDropdown && suggestions.length > 0} unmountOnExit>
                <Paper
                    elevation={4}
                    sx={{
                        position: "absolute",
                        zIndex: 1300,
                        width: "100%",
                        top: "100%",
                        left: 0,
                        mt: 0.5,
                        borderRadius: 2,
                        maxHeight: 260,
                        overflowY: "auto",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <List dense disablePadding sx={{ p: 0.75 }}>
                        {suggestions.map((s, i) => (
                            <ListItemButton
                                key={i}
                                onClick={() => handleSelect(s.display_name, parseFloat(s.lat), parseFloat(s.lon))}
                                selected={i === highlightedIndex}
                                sx={{
                                    borderRadius: 1.5,
                                    minHeight: 44,
                                    px: 1.25,
                                    "&.Mui-selected": {
                                        bgcolor: "primary.main",
                                        color: "primary.contrastText",
                                        "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                                        "&:hover": { bgcolor: "primary.dark" },
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 30, color: "text.disabled" }}>
                                    <PlaceIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={s.display_name}
                                    slotProps={{
                                        primary: { variant: "body2", noWrap: true },
                                    }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            </Fade>
        </Box>
    );
};

export default LocationAutocomplete;

import React, { useEffect, useState, useRef } from "react";
import {
    TextField,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Fade,
    Box,
} from "@mui/material";
import { fetchLocationSuggestions } from "../services/API";
import { Suggestion } from "../models/Suggestion";

interface Props {
    value: string;
    onChange: (val: string) => void;
    onSelect: (val: string) => void;
}

const LocationAutocomplete: React.FC<Props> = ({ value, onChange, onSelect }) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
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
            return;
        }

        const controller = new AbortController();
        const delayDebounce = setTimeout(() => {
            fetchLocationSuggestions(value, controller.signal)
                .then((res) => {
                    setSuggestions(res);
                    setShowDropdown(true);
                    setHighlightedIndex(-1);
                })
                .catch(() => { });
        }, 300);

        return () => {
            clearTimeout(delayDebounce);
            controller.abort();
        };
    }, [value]);

    const handleSelect = (name: string) => {
        onSelect(name);
        setDisableFetch(true);
        setShowDropdown(false);
        setSuggestions([]);

        requestAnimationFrame(() => {
            document.getElementById("location")?.blur();
        });
    };

    return (
        <Box sx={{ position: "relative" }}>
            <TextField
                id="location"
                name="location"
                label="Location"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (!showDropdown || suggestions.length === 0) return;

                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                    } else if (e.key === "Enter" && highlightedIndex >= 0) {
                        e.preventDefault();
                        handleSelect(suggestions[highlightedIndex].display_name);

                        // Re-focus the field
                        requestAnimationFrame(() => {
                            document.querySelector<HTMLInputElement>('#location')?.focus();
                        });
                    } else if (e.key === "Escape") {
                        setShowDropdown(false);
                    }
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                fullWidth
                placeholder="📍 e.g., Tel Aviv"
                autoComplete="off"
            />

            <Fade in={showDropdown && suggestions.length > 0} unmountOnExit>
                <Paper
                    sx={{
                        position: "absolute",
                        zIndex: 10,
                        width: "100%",
                        top: "100%",
                        left: 0,
                        mt: 1,
                        borderRadius: 1,
                        maxHeight: 250,
                        overflowY: "auto",
                    }}
                >
                    <List dense disablePadding>
                        {suggestions.map((s, i) => (
                            <ListItemButton
                                key={i}
                                onClick={() => handleSelect(s.display_name)}
                                selected={i === highlightedIndex}
                                sx={{
                                    px: 2,
                                    '&.Mui-selected': {
                                        backgroundColor: 'action.selected',
                                    },
                                    '&.Mui-selected:hover': {
                                        backgroundColor: 'action.hover',
                                    }
                                }}
                            >
                                <ListItemText primary={s.display_name} />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            </Fade>
        </Box>
    );
};

export default LocationAutocomplete;

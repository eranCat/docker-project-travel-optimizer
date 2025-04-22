import React, { useEffect, useState } from "react";
import {
    TextField,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Fade,
    Box,
} from "@mui/material";
import axios from "axios";

interface Props {
    value: string;
    onChange: (val: string) => void;
    onSelect: (val: string) => void;
}

interface Suggestion {
    display_name: string;
}

const LocationAutocomplete: React.FC<Props> = ({ value, onChange, onSelect }) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        const delayDebounce = setTimeout(() => {
            if (value.trim().length > 2) {
                axios
                    .get(`${import.meta.env.VITE_API_BASE_URL}/autocomplete`, {
                        params: { q: value },
                        signal: controller.signal,
                    })
                    .then((res) => {
                        setSuggestions(res.data || []);
                        setShowDropdown(true);
                    })
                    .catch(() => { });
            } else {
                setSuggestions([]);
                setShowDropdown(false);
            }
        }, 300);

        return () => {
            clearTimeout(delayDebounce);
            controller.abort();
        };
    }, [value]);

    useEffect(() => {
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setShowDropdown(false);
            }
        };

        window.addEventListener("keydown", escHandler);
        return () => window.removeEventListener("keydown", escHandler);
    }, []);


    const handleSelect = (name: string) => {
        onSelect(name);

        // Immediately hide the dropdown and clear suggestions
        setShowDropdown(false);
        setSuggestions([]);

        // Optionally blur the input
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
                onBlur={() => setShowDropdown(false)}
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
                                sx={{ px: 2 }}
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

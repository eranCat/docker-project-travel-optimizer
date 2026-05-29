import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    TextField,
    List,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    ListSubheader,
    Paper,
    Fade,
    Box,
    CircularProgress,
    InputAdornment,
} from "@mui/material";
import PlaceIcon from "@mui/icons-material/Place";
import SearchIcon from "@mui/icons-material/Search";
import HistoryIcon from "@mui/icons-material/History";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { fetchLocationSuggestions } from "../services/API";

interface Props {
    value: string;
    onChange: (val: string) => void;
    onSelect: (val: string, lat?: number, lon?: number) => void;
    id?: string;
    name?: string;
    label?: string;
    placeholder?: string;
}

interface Suggestion {
    display_name: string;
    lat: string;
    lon: string;
}

const RECENTS_KEY = "location-recents";
const MAX_RECENTS = 5;

const POPULAR: { nameKey: string; lat: number; lon: number }[] = [
    { nameKey: "city.telAviv", lat: 32.0853, lon: 34.7818 },
    { nameKey: "city.jerusalem", lat: 31.7683, lon: 35.2137 },
    { nameKey: "city.haifa", lat: 32.794, lon: 34.9896 },
    { nameKey: "city.beerSheva", lat: 31.2518, lon: 34.7913 },
    { nameKey: "city.eilat", lat: 29.5577, lon: 34.9519 },
];

function loadRecents(): Suggestion[] {
    try {
        const raw = localStorage.getItem(RECENTS_KEY);
        return raw ? (JSON.parse(raw) as Suggestion[]) : [];
    } catch {
        return [];
    }
}

function saveRecent(s: Suggestion) {
    const next = [s, ...loadRecents().filter((r) => r.display_name !== s.display_name)].slice(0, MAX_RECENTS);
    try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    } catch {
        /* ignore quota */
    }
}

const LocationAutocomplete: React.FC<Props> = ({
    value,
    onChange,
    onSelect,
    id = "location-input",
    name = "location",
    label = "Location",
    placeholder = "e.g. Tel Aviv",
}) => {
    const { t, i18n } = useTranslation();
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showEmpty, setShowEmpty] = useState(false);
    const [recents, setRecents] = useState<Suggestion[]>([]);
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

        if (!value || value.trim().length < 2) {
            setSuggestions([]);
            setShowDropdown(false);
            setFetching(false);
            return;
        }

        setShowEmpty(false);

        setFetching(true);
        const controller = new AbortController();
        const delay = setTimeout(() => {
            fetchLocationSuggestions(value, controller.signal, i18n.language)
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
        if (lat != null && lon != null) {
            saveRecent({ display_name: name, lat: String(lat), lon: String(lon) });
        }
        setDisableFetch(true);
        setShowDropdown(false);
        setShowEmpty(false);
        setSuggestions([]);
        requestAnimationFrame(() => {
            document.getElementById(id)?.blur();
        });
    };

    const handleFocus = () => {
        if (value.trim().length < 2) {
            setRecents(loadRecents());
            setShowEmpty(true);
        }
    };

    return (
        <Box sx={{ position: "relative" }}>
            <TextField
                id={id}
                name={name}
                label={label}
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
                            document.getElementById(id)?.focus();
                        });
                    } else if (e.key === "Escape") {
                        setShowDropdown(false);
                    }
                }}
                onFocus={handleFocus}
                onBlur={() => setTimeout(() => { setShowDropdown(false); setShowEmpty(false); }, 150)}
                fullWidth
                placeholder={placeholder}
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

            <Fade
                in={(showDropdown && suggestions.length > 0) || (showEmpty && (recents.length > 0 || POPULAR.length > 0))}
                unmountOnExit
            >
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
                        maxHeight: 320,
                        overflowY: "auto",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    {showDropdown && suggestions.length > 0 ? (
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
                                        slotProps={{ primary: { variant: "body2", noWrap: true } }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    ) : (
                        <List dense disablePadding sx={{ p: 0.75 }}>
                            {recents.length > 0 && (
                                <ListSubheader disableSticky sx={{ lineHeight: "28px", bgcolor: "transparent", fontSize: "0.7rem" }}>
                                    {t("form.recentLocations")}
                                </ListSubheader>
                            )}
                            {recents.map((s, i) => (
                                <ListItemButton
                                    key={`r-${i}`}
                                    onClick={() => handleSelect(s.display_name, parseFloat(s.lat), parseFloat(s.lon))}
                                    sx={{ borderRadius: 1.5, minHeight: 40, px: 1.25 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 30, color: "text.disabled" }}>
                                        <HistoryIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={s.display_name}
                                        slotProps={{ primary: { variant: "body2", noWrap: true } }}
                                    />
                                </ListItemButton>
                            ))}
                            <ListSubheader disableSticky sx={{ lineHeight: "28px", bgcolor: "transparent", fontSize: "0.7rem" }}>
                                {t("form.popularLocations")}
                            </ListSubheader>
                            {POPULAR.map((p, i) => (
                                <ListItemButton
                                    key={`p-${i}`}
                                    onClick={() => handleSelect(t(p.nameKey), p.lat, p.lon)}
                                    sx={{ borderRadius: 1.5, minHeight: 40, px: 1.25 }}
                                >
                                    <ListItemIcon sx={{ minWidth: 30, color: "text.disabled" }}>
                                        <StarBorderIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={t(p.nameKey)}
                                        slotProps={{ primary: { variant: "body2", noWrap: true } }}
                                    />
                                </ListItemButton>
                            ))}
                        </List>
                    )}
                </Paper>
            </Fade>
        </Box>
    );
};

export default LocationAutocomplete;

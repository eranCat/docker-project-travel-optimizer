import React, { useState } from "react";
import {
    Box,
    Button,
    Stack,
    TextField,
    Typography,
    Divider,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
    Collapse,
    IconButton,
    Tooltip,
    FormControlLabel,
    Switch,
    MenuItem,
    Select,
    Slider,
} from "@mui/material";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import RouteIcon from "@mui/icons-material/Route";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CancelIcon from "@mui/icons-material/Cancel";
import TuneIcon from "@mui/icons-material/Tune";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccessibleIcon from "@mui/icons-material/Accessible";
import CasinoIcon from "@mui/icons-material/Casino";
import ExploreIcon from "@mui/icons-material/Explore";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import LocationAutocomplete from "./LocationAutocomplete";
import LoadingProgress from "./LoadingProgress";

interface FormData {
    interests: string;
    location: string;
    radius_km: number;
    num_routes: number;
    num_pois: number;
    travel_mode: string;
    latitude?: number;
    longitude?: number;
    wheelchair: boolean;
    time_of_day: string;
    num_days: number;
    mode: "explore" | "trip";
    dest_location: string;
    dest_latitude?: number;
    dest_longitude?: number;
}

interface Props {
    form: FormData;
    loading: boolean;
    stage: number;
    stages: string[];
    error: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
    onEdit: () => void;
    onBackToRoutes?: () => void;
    hasSavedRoutes?: boolean;
    onValidLocationSelected: () => void;
    onLocationSelected: (lat: number, lon: number) => void;
    onValidDestSelected: () => void;
    onDestLocationSelected: (lat: number, lon: number) => void;
    onCancel: () => void;
    onSurpriseMe: () => void;
    isFormValid: boolean;
    compact?: boolean;
}

const TRAVEL_MODES = [
    { value: "walking", label: "Walk", icon: <DirectionsWalkIcon sx={{ fontSize: 18 }} /> },
    { value: "driving", label: "Drive", icon: <DirectionsCarIcon sx={{ fontSize: 18 }} /> },
    { value: "cycling", label: "Cycle", icon: <DirectionsBikeIcon sx={{ fontSize: 18 }} /> },
];

const RouteForm: React.FC<Props> = ({
    form,
    loading,
    stage,
    stages,
    error,
    onChange,
    onSubmit,
    onReset,
    onEdit,
    onBackToRoutes,
    hasSavedRoutes = false,
    onValidLocationSelected,
    onLocationSelected,
    onValidDestSelected,
    onDestLocationSelected,
    onCancel,
    onSurpriseMe,
    isFormValid,
    compact = false,
}) => {
    const isTrip = form.mode === "trip";
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Compact summary bar shown after search is initiated
    if (compact) {
        return (
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 2,
                    py: 1.25,
                    bgcolor: "background.paper",
                    flexShrink: 0,
                }}
            >
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography
                        variant="caption"
                        fontWeight={700}
                        color="text.primary"
                        noWrap
                        sx={{ display: "block", lineHeight: 1.3, fontFamily: '"Space Grotesk", "Inter", sans-serif' }}
                    >
                        {form.mode === "trip"
                            ? `${form.location || "Start"} → ${form.dest_location || "Destination"}`
                            : form.location || "Unknown location"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", lineHeight: 1.4 }}>
                        {form.interests || "No interests"} · {TRAVEL_MODES.find(m => m.value === form.travel_mode)?.label ?? form.travel_mode}
                    </Typography>
                </Box>
                {loading ? (
                    <Tooltip title="Cancel generation">
                        <IconButton size="small" onClick={onCancel} color="error" sx={{ flexShrink: 0 }}>
                            <CancelIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                ) : (
                    <Tooltip title="Edit search">
                        <IconButton size="small" onClick={onEdit} sx={{ color: "text.secondary", flexShrink: 0 }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        );
    }

    return (
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2, gap: 0 }}
        >
            {/* Header */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography
                    variant="subtitle1"
                    sx={{
                        fontFamily: '"Space Grotesk", "Inter", sans-serif',
                        fontWeight: 700,
                        color: "text.primary",
                    }}
                >
                    Plan Your Route
                </Typography>
                <Tooltip title="Reset form">
                    <IconButton size="small" onClick={onReset} sx={{ color: "text.disabled" }}>
                        <RestartAltIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>

            <Stack spacing={1.75} sx={{ flexGrow: 1, overflowY: "auto", minHeight: 0, pr: 0.5 }}>
                {/* Mode: explore an area vs plan an A→B trip */}
                <ToggleButtonGroup
                    value={form.mode}
                    exclusive
                    onChange={(_, val) => {
                        if (val !== null) {
                            onChange({ target: { name: "mode", value: val } } as any);
                        }
                    }}
                    fullWidth
                    size="small"
                    aria-label="Route mode"
                    sx={{
                        gap: 0.75,
                        "& .MuiToggleButton-root": {
                            flex: 1,
                            gap: 0.5,
                            fontWeight: 500,
                            fontSize: "0.8rem",
                            borderRadius: "8px !important",
                            border: "1px solid",
                            borderColor: "divider",
                            minHeight: 40,
                            color: "text.secondary",
                            "&.Mui-selected": {
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                borderColor: "primary.main",
                                "&:hover": { bgcolor: "primary.dark" },
                            },
                        },
                    }}
                >
                    <ToggleButton value="explore" aria-label="Explore area">
                        <ExploreIcon sx={{ fontSize: 18 }} />
                        Explore area
                    </ToggleButton>
                    <ToggleButton value="trip" aria-label="A to B trip">
                        <SwapHorizIcon sx={{ fontSize: 18 }} />
                        A → B trip
                    </ToggleButton>
                </ToggleButtonGroup>

                {/* Start location */}
                <LocationAutocomplete
                    id="location-input"
                    name="location"
                    label={isTrip ? "Start" : "Location"}
                    value={form.location}
                    onChange={(val) =>
                        onChange({ target: { name: "location", value: val } } as any)
                    }
                    onSelect={(val, lat, lon) => {
                        onChange({ target: { name: "location", value: val } } as any);
                        if (lat !== undefined && lon !== undefined) {
                            onLocationSelected(lat, lon);
                        }
                        onValidLocationSelected();
                    }}
                />

                {/* Destination (A→B mode only) */}
                {isTrip && (
                    <LocationAutocomplete
                        id="dest-location-input"
                        name="dest_location"
                        label="Destination"
                        placeholder="e.g. Jerusalem"
                        value={form.dest_location}
                        onChange={(val) =>
                            onChange({ target: { name: "dest_location", value: val } } as any)
                        }
                        onSelect={(val, lat, lon) => {
                            onChange({ target: { name: "dest_location", value: val } } as any);
                            if (lat !== undefined && lon !== undefined) {
                                onDestLocationSelected(lat, lon);
                            }
                            onValidDestSelected();
                        }}
                    />
                )}

                {/* Interests + Surprise Me */}
                <TextField
                    label="Interests"
                    name="interests"
                    fullWidth
                    size="small"
                    value={form.interests}
                    onChange={onChange}
                    placeholder="food, art, hiking…"
                    helperText="Separate with commas"
                    slotProps={{
                        input: {
                            endAdornment: (
                                <Tooltip title="Surprise me — pick random interests">
                                    <IconButton size="small" onClick={onSurpriseMe} tabIndex={-1}
                                        sx={{ color: "text.disabled", "&:hover": { color: "primary.main" } }}>
                                        <CasinoIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            ),
                        },
                    }}
                />

                {/* Travel mode */}
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: "block", fontWeight: 500 }}>
                        Travel Mode
                    </Typography>
                    <ToggleButtonGroup
                        value={form.travel_mode}
                        exclusive
                        onChange={(_, val) => {
                            if (val !== null) {
                                onChange({ target: { name: "travel_mode", value: val } } as any);
                            }
                        }}
                        fullWidth
                        size="small"
                        aria-label="Travel mode"
                        sx={{
                            gap: 0.75,
                            "& .MuiToggleButton-root": {
                                flex: 1,
                                gap: 0.5,
                                fontWeight: 500,
                                fontSize: "0.8rem",
                                borderRadius: "8px !important",
                                border: "1px solid",
                                borderColor: "divider",
                                minHeight: 40,
                                color: "text.secondary",
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    borderColor: "primary.main",
                                    "&:hover": { bgcolor: "primary.dark" },
                                },
                            },
                        }}
                    >
                        {TRAVEL_MODES.map(({ value, label, icon }) => (
                            <ToggleButton key={value} value={value} aria-label={label}>
                                {icon}
                                {label}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Box>

                <Divider />

                {/* Advanced settings toggle */}
                <Box>
                    <Button
                        size="small"
                        variant="text"
                        color="inherit"
                        onClick={() => setShowAdvanced(v => !v)}
                        startIcon={<TuneIcon fontSize="small" />}
                        sx={{
                            color: "text.secondary",
                            fontSize: "0.8rem",
                            p: 0,
                            minWidth: 0,
                            "&:hover": { color: "primary.main", bgcolor: "transparent" },
                        }}
                        disableRipple
                    >
                        {showAdvanced ? "Hide advanced" : "Advanced settings"}
                    </Button>

                    <Collapse in={showAdvanced} unmountOnExit>
                        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                            <TextField
                                fullWidth
                                label={isTrip ? "Corridor (km)" : "Radius (km)"}
                                name="radius_km"
                                type="number"
                                size="small"
                                value={form.radius_km}
                                onChange={onChange}
                                slotProps={{
                                    input: { inputMode: "numeric" },
                                    inputLabel: { shrink: true },
                                }}
                            />
                            {!isTrip && (
                                <TextField
                                    fullWidth
                                    label="Routes"
                                    name="num_routes"
                                    type="number"
                                    size="small"
                                    value={form.num_routes}
                                    onChange={onChange}
                                    slotProps={{
                                        input: { inputMode: "numeric" },
                                        inputLabel: { shrink: true },
                                    }}
                                />
                            )}
                            <TextField
                                fullWidth
                                label="POIs"
                                name="num_pois"
                                type="number"
                                size="small"
                                value={form.num_pois}
                                onChange={onChange}
                                slotProps={{
                                    input: { inputMode: "numeric" },
                                    inputLabel: { shrink: true },
                                }}
                            />
                        </Stack>

                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block", fontWeight: 500 }}>
                                Time of day
                            </Typography>
                            <Select
                                name="time_of_day"
                                size="small"
                                fullWidth
                                displayEmpty
                                value={form.time_of_day}
                                onChange={(e) => onChange({ target: { name: "time_of_day", value: e.target.value } } as any)}
                                sx={{ fontSize: "0.85rem" }}
                            >
                                <MenuItem value=""><em>Any time</em></MenuItem>
                                <MenuItem value="morning">Morning</MenuItem>
                                <MenuItem value="afternoon">Afternoon</MenuItem>
                                <MenuItem value="evening">Evening</MenuItem>
                                <MenuItem value="night">Night</MenuItem>
                            </Select>
                        </Box>

                        <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Days: {form.num_days}
                            </Typography>
                            <Slider
                                size="small"
                                min={1} max={5} step={1}
                                value={Number(form.num_days)}
                                onChange={(_, v) => onChange({ target: { name: "num_days", value: String(v) } } as any)}
                                marks
                                valueLabelDisplay="auto"
                                sx={{ mt: 0.5 }}
                            />
                        </Box>

                        <FormControlLabel
                            control={
                                <Switch
                                    size="small"
                                    checked={form.wheelchair}
                                    onChange={(e) => onChange({ target: { name: "wheelchair", value: e.target.checked } } as any)}
                                />
                            }
                            label={
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                    <AccessibleIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                                    <Typography variant="caption" color="text.secondary">Wheelchair accessible only</Typography>
                                </Box>
                            }
                            sx={{ ml: 0, mt: 0.5 }}
                        />
                    </Collapse>
                </Box>
            </Stack>

            {/* Loading + error */}
            <Box sx={{ mt: 2 }}>
                <LoadingProgress loading={loading} stages={stages} stage={stage} />
                {error && (
                    <Alert
                        severity="error"
                        variant="outlined"
                        sx={{ borderRadius: 2, fontSize: "0.8125rem", whiteSpace: "pre-line" }}
                    >
                        {error}
                    </Alert>
                )}
            </Box>

            {/* CTA */}
            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1 }}>
                {hasSavedRoutes && !loading && (
                    <Button
                        variant="outlined"
                        fullWidth
                        size="small"
                        onClick={onBackToRoutes}
                        startIcon={<ArrowBackIcon fontSize="small" />}
                        sx={{ fontWeight: 600 }}
                    >
                        Back to results
                    </Button>
                )}
                {loading ? (
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        size="small"
                        onClick={onCancel}
                        startIcon={<CancelIcon fontSize="small" />}
                    >
                        Cancel
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        disabled={!isFormValid}
                        startIcon={<RouteIcon fontSize="small" />}
                        sx={{ py: 1.1, fontWeight: 700 }}
                    >
                        Generate Route
                    </Button>
                )}
            </Box>
        </Box>
    );
};

export default RouteForm;

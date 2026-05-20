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
    onCancel: () => void;
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
    onCancel,
    isFormValid,
    compact = false,
}) => {
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
                        {form.location || "Unknown location"}
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

            <Stack spacing={1.75} sx={{ flexGrow: 1 }}>
                {/* Location */}
                <LocationAutocomplete
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

                {/* Interests */}
                <TextField
                    label="Interests"
                    name="interests"
                    fullWidth
                    size="small"
                    value={form.interests}
                    onChange={onChange}
                    placeholder="food, art, hiking…"
                    helperText="Separate with commas"
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
                                label="Radius (km)"
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

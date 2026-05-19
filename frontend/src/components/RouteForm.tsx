import React from "react";
import {
    Box,
    Button,
    Stack,
    TextField,
    Typography,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Alert,
    ToggleButtonGroup,
    ToggleButton,
    Tooltip,
} from "@mui/material";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import DirectionsBikeIcon from "@mui/icons-material/DirectionsBike";
import RouteIcon from "@mui/icons-material/Route";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CancelIcon from "@mui/icons-material/Cancel";
import LocationAutocomplete from "./LocationAutocomplete";
import LoadingProgress from "./LoadingProgress";

interface FormData {
    interests: string;
    location: string;
    radius_km: number;
    num_routes: number;
    num_pois: number;
    travel_mode: string;
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
    onValidLocationSelected: () => void;
    onCancel: () => void;
    isFormValid: boolean;
}

const TRAVEL_MODES = [
    { value: "walking", label: "Walk", icon: <DirectionsWalkIcon fontSize="small" /> },
    { value: "driving", label: "Drive", icon: <DirectionsCarIcon fontSize="small" /> },
    { value: "cycling", label: "Cycle", icon: <DirectionsBikeIcon fontSize="small" /> },
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
    onValidLocationSelected,
    onCancel,
    isFormValid,
}) => {
    return (
        <Box
            component="form"
            onSubmit={onSubmit}
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                p: 2.5,
                gap: 0,
            }}
        >
            {/* Title */}
            <Typography
                variant="h6"
                sx={{
                    fontFamily: '"Space Grotesk", "Inter", sans-serif',
                    fontWeight: 700,
                    mb: 0.5,
                    color: "text.primary",
                }}
            >
                Plan Your Route
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                Fill in your preferences and generate a route.
            </Typography>

            <Stack spacing={2.5} sx={{ flexGrow: 1 }}>
                {/* Location */}
                <LocationAutocomplete
                    value={form.location}
                    onChange={(val) =>
                        onChange({ target: { name: "location", value: val } } as any)
                    }
                    onSelect={(val) => {
                        onChange({ target: { name: "location", value: val } } as any);
                        onValidLocationSelected();
                    }}
                />

                {/* Interests */}
                <TextField
                    label="Interests"
                    name="interests"
                    fullWidth
                    value={form.interests}
                    onChange={onChange}
                    placeholder="e.g. food, art, hiking"
                    helperText="Separate with commas"
                />

                <Divider />

                {/* Numeric row */}
                <Stack direction="row" spacing={1.5}>
                    <TextField
                        fullWidth
                        label="Radius (km)"
                        name="radius_km"
                        type="number"
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
                        value={form.num_pois}
                        onChange={onChange}
                        slotProps={{
                            input: { inputMode: "numeric" },
                            inputLabel: { shrink: true },
                        }}
                    />
                </Stack>

                {/* Travel mode toggle */}
                <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontWeight: 500 }}>
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
                            "& .MuiToggleButton-root": {
                                flex: 1,
                                gap: 0.75,
                                fontWeight: 500,
                                fontSize: "0.8125rem",
                                borderRadius: "8px !important",
                                border: "1px solid",
                                borderColor: "divider",
                                minHeight: 44,
                                color: "text.secondary",
                                "&.Mui-selected": {
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    borderColor: "primary.main",
                                    "&:hover": { bgcolor: "primary.dark" },
                                },
                            },
                            gap: 1,
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
            </Stack>

            {/* Loading + error feedback */}
            <Box sx={{ mt: 2.5 }}>
                <LoadingProgress loading={loading} stages={stages} stage={stage} />
                {error && (
                    <Alert
                        severity="error"
                        variant="outlined"
                        sx={{ borderRadius: 2, fontSize: "0.875rem", whiteSpace: "pre-line" }}
                    >
                        {error}
                    </Alert>
                )}
            </Box>

            {/* Action buttons */}
            <Stack spacing={1.5} sx={{ mt: 2 }}>
                {loading ? (
                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={onCancel}
                        startIcon={<CancelIcon />}
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
                        startIcon={<RouteIcon />}
                        sx={{ py: 1.25 }}
                    >
                        Generate Route
                    </Button>
                )}
                <Button
                    type="button"
                    variant="text"
                    color="inherit"
                    fullWidth
                    onClick={onReset}
                    startIcon={<RestartAltIcon />}
                    sx={{ color: "text.secondary", py: 1 }}
                >
                    Reset
                </Button>
            </Stack>
        </Box>
    );
};

export default RouteForm;

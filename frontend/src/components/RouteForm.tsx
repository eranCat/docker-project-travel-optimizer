import React from "react";
import {
    Box,
    Button,
    Paper,
    Stack,
    TextField,
    Typography,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
} from "@mui/material";
import LocationAutocomplete from "./LocationAutocomplete";

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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    onReset: () => void;
    onValidLocationSelected: () => void;
    onCancel: () => void;
    isFormValid: boolean;
}

const RouteForm: React.FC<Props> = ({
    form,
    loading,
    onChange,
    onSubmit,
    onReset,
    onValidLocationSelected,
    onCancel,
    isFormValid,
}) => {
    return (
        <Paper
            elevation={3}
            sx={{
                p: 4,
                borderRadius: 3,
                mb: 3,
                bgcolor: (theme) => theme.palette.background.paper,
            }}
        >
            <Typography variant="h5" fontWeight={600} gutterBottom>
                Plan Your Route
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={3}>
                Fill in your preferences and we'll generate the best route.
            </Typography>

            <Box component="form" onSubmit={onSubmit}>
                <Stack spacing={3}>
                    {/* First row: Interests + Location */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                label="Interests"
                                name="interests"
                                fullWidth
                                value={form.interests}
                                onChange={onChange}
                                placeholder="🎯 e.g., food, art, yoga"
                            />
                        </Box>

                        <Box sx={{ flex: 1 }}>
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
                        </Box>
                    </Stack>

                    <Divider />

                    {/* Second row: Numbers */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            label="Radius (km)"
                            name="radius_km"
                            type="number"
                            fullWidth
                            value={form.radius_km}
                            onChange={onChange}
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label="Number of Routes"
                            name="num_routes"
                            type="number"
                            fullWidth
                            value={form.num_routes}
                            onChange={onChange}
                            inputProps={{ min: 1 }}
                        />
                        <TextField
                            label="POIs per Route"
                            name="num_pois"
                            type="number"
                            fullWidth
                            value={form.num_pois}
                            onChange={onChange}
                            inputProps={{ min: 1 }}
                        />
                    </Stack>

                    <Divider />

                    {/* Buttons */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        {loading ? (
                            <Button variant="outlined" color="error" fullWidth onClick={onCancel}>
                                ✖ Cancel
                            </Button>
                        ) : (
                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={!isFormValid}
                            >
                                Generate Route
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            onClick={onReset}
                        >
                            🧹 Reset
                        </Button>
                    </Stack>

                    <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel id="travel-mode-label">Travel Mode</InputLabel>
                        <Select
                            labelId="travel-mode-label"
                            id="travel-mode-select"
                            name="travel_mode"
                            value={form.travel_mode || ""}
                            label="Travel Mode"
                            onChange={(e) => {
                                onChange({
                                    target: {
                                        name: "travel_mode",
                                        value: e.target.value,
                                    },
                                } as any);
                            }}
                        >
                            <MenuItem value="walking">🚶 Walking</MenuItem>
                            <MenuItem value="driving">🚗 Driving</MenuItem>
                            <MenuItem value="cycling">🚲 Cycling</MenuItem>
                        </Select>

                    </FormControl>

                </Stack>
            </Box>
        </Paper>
    );
};

export default RouteForm;

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
    useTheme,
    Alert,
} from "@mui/material";
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
    const theme = useTheme();

    return (
        <Paper
            elevation={3}
            sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                p: 3,
                bgcolor: theme.palette.background.paper,
                boxSizing: "border-box",
                overflowY: "auto",
            }}
        >

            <Typography variant="h5" fontWeight={600} gutterBottom>
                Plan Your Route
            </Typography>

            <Typography variant="body2" color="text.secondary" mb={3}>
                Fill in your preferences and we'll generate the best route.
            </Typography>

            <Box
                component="form"
                onSubmit={onSubmit}
                sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}
            >
                <Stack spacing={3} sx={{ flexGrow: 1 }}>

                    {/* Interests + Location */}
                    <Stack spacing={2}>
                        <TextField
                            label="Interests"
                            name="interests"
                            fullWidth
                            value={form.interests}
                            onChange={onChange}
                            placeholder="🎯 e.g., food, art, yoga"
                        />

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
                    </Stack>

                    <Divider />

                    {/* Numeric Fields */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                        <TextField
                            fullWidth
                            label="Radius (km)"
                            name="radius_km"
                            type="number"
                            value={form.radius_km}
                            onChange={onChange}
                            slotProps={{
                                input: {
                                    inputMode: "numeric",
                                    minRows: 1,
                                    style: { padding: "12px" },
                                },
                                inputLabel:{
                                    shrink: true,
                                    style: { whiteSpace: "normal", lineHeight: "1.2" },
                                }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Number of Routes"
                            name="num_routes"
                            type="number"
                            value={form.num_routes}
                            onChange={onChange}
                            slotProps={{
                                input: {
                                    inputMode: "numeric",
                                    minRows: 1,
                                    style: { padding: "12px" },
                                },
                                inputLabel:{
                                    shrink: true,
                                    style: { whiteSpace: "normal", lineHeight: "1.2" },
                                }
                            }}
                        />
                        <TextField
                            fullWidth
                            label="POIs per Route"
                            name="num_pois"
                            type="number"
                            value={form.num_pois}
                            onChange={onChange}
                            slotProps={{
                                input: {
                                    inputMode: "numeric",
                                    minRows: 1,
                                    style: { padding: "12px" },
                                },
                                inputLabel:{
                                    shrink: true,
                                    style: { whiteSpace: "normal", lineHeight: "1.2" },
                                }
                            }}
                        />
                    </Stack>

                    <Divider />

                    {/* Travel Mode */}
                    <FormControl fullWidth>
                        <InputLabel id="travel-mode-label">Travel Mode</InputLabel>
                        <Select
                            labelId="travel-mode-label"
                            id="travel-mode-select"
                            name="travel_mode"
                            value={form.travel_mode || ""}
                            label="Travel Mode"
                            onChange={(e) =>
                                onChange({
                                    target: {
                                        name: "travel_mode",
                                        value: e.target.value,
                                    },
                                } as any)
                            }
                        >
                            <MenuItem value="walking">🚶 Walking</MenuItem>
                            <MenuItem value="driving">🚗 Driving</MenuItem>
                            <MenuItem value="cycling">🚲 Cycling</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Buttons */}
                    <Box
                        sx={{
                            mt: "auto",
                            pt: 2,
                        }}                      
                    >
                        <Stack spacing={3} sx={{ height: "100%" }}>
                            {loading ? (
                                <Button
                                    variant="outlined"
                                    color="error"
                                    fullWidth
                                    onClick={onCancel}
                                    startIcon={<span>✖</span>}
                                    sx={{ textTransform: "none" }}
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
                                    startIcon={<span>🚀</span>}
                                    sx={{
                                        fontWeight: 600,
                                        py: 1.25,
                                        letterSpacing: 0.5,
                                        textTransform: "none",
                                    }}
                                >
                                    Generate route
                                </Button>
                            )}

                            <Button
                                type="button"
                                variant="outlined"
                                color="secondary"
                                fullWidth
                                onClick={onReset}
                                startIcon={<span>🧹</span>}
                                sx={{
                                    fontWeight: 500,
                                    py: 1.25,
                                    textTransform: "none",
                                }}
                            >
                                Reset
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>

            <Box sx={{ mt: 3 }}>
                <LoadingProgress loading={loading} stages={stages} stage={stage} />

                {/* Error display */}
                {error && (
                    <Alert
                        severity="error"
                        variant="outlined"
                        sx={{
                            mt: 3,
                            borderRadius: 2,
                            fontSize: "0.9rem",
                            lineHeight: 1.6,
                            whiteSpace: "pre-line",
                        }}
                    >
                        
                        {error}
                    </Alert>
                )}
            </Box>
        </Paper>
    );
};

export default RouteForm;

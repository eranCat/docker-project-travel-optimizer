import React from "react";
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";

interface Props {
    selectedIndex: number;
    routeCount: number;
    onSelect: (index: number) => void;
}

const RouteSelector: React.FC<Props> = ({
    selectedIndex,
    routeCount,
    onSelect,
}) => {
    // only show when there are 2 or more routes
    if (routeCount <= 1) return null;

    return (
        <div style={{ marginBottom: "2rem" }}>
            <Typography variant="subtitle1" fontWeight={500} gutterBottom>
                Select a Route:
            </Typography>
            <FormControl fullWidth>
                <InputLabel id="route-select-label">Route</InputLabel>
                <Select
                    labelId="route-select-label"
                    label="Route"
                    value={selectedIndex}
                    onChange={(e) => onSelect(Number(e.target.value))}
                >
                    {Array.from({ length: routeCount }).map((_, i) => (
                        <MenuItem key={i} value={i}>
                            Route {i + 1}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
};

export default RouteSelector;

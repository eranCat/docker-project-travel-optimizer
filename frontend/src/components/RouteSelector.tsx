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
    if (routeCount <= 1) return null;

    return (
        <div style={{ marginBottom: "1rem", marginTop: "1rem" }}>
            <FormControl fullWidth>
                <InputLabel id="route-select-label">Select route</InputLabel>
                <Select
                    labelId="route-select-label"
                    label="Route"
                    value={selectedIndex}
                    onChange={(e) => onSelect(Number(e.target.value))}
                    variant="outlined"
                    size="small"
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
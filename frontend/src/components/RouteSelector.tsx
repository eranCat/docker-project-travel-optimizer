import React from "react";
import {
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    SelectChangeEvent,
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

    const handleSelect = (event: SelectChangeEvent<number>) => {
        const newIndex = Number(event.target.value);
        if (newIndex >= 0 && newIndex < routeCount) {
            onSelect(newIndex);
        }
    };

    return (
        <div style={{ marginBottom: "1rem", marginTop: "1rem" }}>
            <FormControl fullWidth>
                <InputLabel id="route-select-label">Select route</InputLabel>
                <Select
                    labelId="route-select-label"
                    label="Route"
                    value={selectedIndex < routeCount ? selectedIndex : ""}
                    onChange={handleSelect}
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
import React from "react";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import RouteIcon from "@mui/icons-material/Route";

interface Props {
    selectedIndex: number;
    routeCount: number;
    onSelect: (index: number) => void;
}

const RouteSelector: React.FC<Props> = ({ selectedIndex, routeCount, onSelect }) => {
    const { t } = useTranslation();
    if (routeCount <= 1) return null;

    const current = selectedIndex < routeCount ? selectedIndex : 0;

    return (
        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid",
                borderColor: "divider",
                px: 0.5,
                py: 0.25,
                minHeight: 44,
            }}
        >
            <IconButton
                size="small"
                onClick={() => onSelect(current - 1)}
                disabled={current === 0}
                aria-label="Previous route"
            >
                <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
            </IconButton>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <RouteIcon sx={{ fontSize: 18, color: "primary.main" }} />
                <Typography variant="body2" fontWeight={600} sx={{ userSelect: "none" }}>
                    {t("route.label", { n: current + 1 })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ userSelect: "none" }}>
                    / {routeCount}
                </Typography>
            </Box>

            <IconButton
                size="small"
                onClick={() => onSelect(current + 1)}
                disabled={current === routeCount - 1}
                aria-label="Next route"
            >
                <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
            </IconButton>
        </Box>
    );
};

export default RouteSelector;

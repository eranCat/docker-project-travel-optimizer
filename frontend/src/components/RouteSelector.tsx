import React from "react";
import { useTranslation } from "react-i18next";
import { Tabs, Tab, Box } from "@mui/material";
import RouteIcon from "@mui/icons-material/Route";

interface Props {
    selectedIndex: number;
    routeCount: number;
    onSelect: (index: number) => void;
}

const RouteSelector: React.FC<Props> = ({ selectedIndex, routeCount, onSelect }) => {
    const { t } = useTranslation();
    if (routeCount <= 1) return null;

    return (
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
            <Tabs
                value={selectedIndex < routeCount ? selectedIndex : 0}
                onChange={(_, val) => onSelect(val)}
                variant="scrollable"
                scrollButtons="auto"
                textColor="primary"
                indicatorColor="primary"
                aria-label="Select route"
                sx={{
                    minHeight: 44,
                    "& .MuiTab-root": {
                        minHeight: 44,
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                        textTransform: "none",
                        gap: 0.5,
                    },
                }}
            >
                {Array.from({ length: routeCount }).map((_, i) => (
                    <Tab
                        key={i}
                        value={i}
                        label={t("route.label", { n: i + 1 })}
                        icon={<RouteIcon fontSize="small" />}
                        iconPosition="start"
                    />
                ))}
            </Tabs>
        </Box>
    );
};

export default RouteSelector;

import React from "react";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExploreIcon from "@mui/icons-material/Explore";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Typography, Box } from "@mui/material";

interface Props {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    mode: "light" | "dark";
    toggleTheme: () => void;
    backendHealthy?: boolean | null;
}

const MainLayout: React.FC<Props> = ({ title, children, footer, mode, toggleTheme, backendHealthy }) => {
    return (
        <Box
            sx={{
                height: "100dvh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
                bgcolor: "background.default",
                color: "text.primary",
                overflow: "hidden",
            }}
        >
            <Box
                component="header"
                sx={{
                    flexShrink: 0,
                    height: 60,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2.5,
                    bgcolor: "background.paper",
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    boxShadow: 1,
                    zIndex: 20,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ExploreIcon sx={{ color: "primary.main", fontSize: 26 }} />
                    <Typography
                        component="h1"
                        variant="h6"
                        sx={{
                            fontFamily: '"Space Grotesk", "Inter", sans-serif',
                            fontWeight: 700,
                            color: "primary.main",
                            lineHeight: 1,
                        }}
                    >
                        {title}
                    </Typography>
                </Box>

                <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    <IconButton
                        onClick={toggleTheme}
                        size="small"
                        aria-label={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        sx={{ color: "text.secondary" }}
                    >
                        {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            {backendHealthy === false && (
                <Box
                    sx={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 2,
                        py: 0.75,
                        bgcolor: "error.main",
                        color: "error.contrastText",
                    }}
                >
                    <WifiOffIcon sx={{ fontSize: 16 }} />
                    <Typography variant="caption" fontWeight={600}>
                        Backend unavailable — route generation is disabled. Retrying…
                    </Typography>
                </Box>
            )}

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    overflow: "hidden",
                    display: "flex",
                    minHeight: 0,
                }}
            >
                {children}
            </Box>

            {footer && (
                <Box
                    component="footer"
                    sx={{
                        flexShrink: 0,
                        height: 40,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        bgcolor: "background.paper",
                        borderTop: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        {footer}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default MainLayout;

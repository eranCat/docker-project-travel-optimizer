import React from "react";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Typography, Box } from "@mui/material";

interface Props {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    mode: "light" | "dark";
    toggleTheme: () => void;
}

const MainLayout: React.FC<Props> = ({ title, children, footer, mode, toggleTheme }) => {
    return (
        <Box
            sx={{
                height: "100vh",
                width: "100vw",
                display: "flex",
                flexDirection: "column",
                background: mode === "dark"
                    ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
                    : "#f5f5f5",
                color: (theme) => theme.palette.text.primary,
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    flexShrink: 0,
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 3,
                    backgroundColor: mode === "dark" ? "#1a1a1a" : "#ffffff",
                    borderBottom: "1px solid #ccc",
                }}
            >
                <Typography
                    variant="h6"
                    component="div"
                    sx={{ fontWeight: 600 }}
                >
                    {title}
                </Typography>

                <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                    <IconButton onClick={toggleTheme} sx={{ color: "inherit" }}>
                        {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Main content (fills the rest of the screen) */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: "hidden",
                    display: "flex",
                }}
            >
                {children}
            </Box>

            {/* Footer (optional) */}
            {footer && (
                <Box
                    sx={{
                        height: 40,
                        textAlign: "center",
                        backgroundColor: "#eee",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="body2">{footer}</Typography>
                </Box>
            )}
        </Box>
    );
};

export default MainLayout;

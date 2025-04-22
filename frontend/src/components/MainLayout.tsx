import React from "react";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Typography, Container, Box } from "@mui/material";

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
                minHeight: "100vh",
                background: (theme) =>
                    mode === "dark"
                        ? "linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
                        : "linear-gradient(to right, #e0eafc, #cfdef3)",
                color: (theme) => theme.palette.text.primary,
                py: 6,
            }}
        >
            <Container maxWidth="md">

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                        flexWrap: "wrap",
                        gap: 2,
                    }}
                >
                    <Typography
                        variant="h3"
                        component="h1"
                        sx={{
                            fontWeight: 600,
                            fontFamily: "Inter, sans-serif",
                        }}
                    >
                        {title}
                    </Typography>

                    <Tooltip title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{
                                position: "absolute",
                                top: 24,
                                right: 24,
                                color: (theme) => theme.palette.text.primary, // 🎨 match current text color
                            }}
                        >
                            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>

                {children}

                {footer && (
                    <Typography
                        variant="body2"
                        align="center"
                        sx={{ mt: 4, color: "text.secondary" }}
                    >
                        {footer}
                    </Typography>
                )}
            </Container>
        </Box>
    );
};

export default MainLayout;

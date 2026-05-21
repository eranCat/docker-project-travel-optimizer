import React from "react";
import { useTranslation } from "react-i18next";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import ExploreIcon from "@mui/icons-material/Explore";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Typography, Box, Button } from "@mui/material";

interface Props {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    mode: "light" | "dark";
    toggleTheme: () => void;
    toggleLang: () => void;
    backendHealthy?: boolean | null;
}

const MainLayout: React.FC<Props> = ({ title, children, footer, mode, toggleTheme, toggleLang, backendHealthy }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.language === "he";

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

                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Tooltip title={t("nav.langToggle")}>
                        <Button
                            onClick={toggleLang}
                            size="small"
                            sx={{
                                minWidth: 36,
                                height: 36,
                                fontWeight: 700,
                                fontSize: "0.8rem",
                                color: "text.secondary",
                                borderRadius: 2,
                                px: 1,
                                "&:hover": { color: "primary.main" },
                            }}
                        >
                            {isRtl ? "EN" : "עב"}
                        </Button>
                    </Tooltip>
                    <Tooltip title={mode === "dark" ? t("nav.toggleLight") : t("nav.toggleDark")}>
                        <IconButton
                            onClick={toggleTheme}
                            size="small"
                            aria-label={mode === "dark" ? t("nav.toggleLight") : t("nav.toggleDark")}
                            sx={{ color: "text.secondary" }}
                        >
                            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                        </IconButton>
                    </Tooltip>
                </Box>
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
                        {t("backend.unavailable")}
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

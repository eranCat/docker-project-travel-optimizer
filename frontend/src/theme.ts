import { createTheme } from "@mui/material";

export const getTheme = (mode: "light" | "dark") =>
    createTheme({
        palette: {
            mode,
            primary: {
                main: "#1976d2",
            },
            secondary: {
                main: "#d81b60",
            },
            background: {
                default: mode === "dark" ? "#121212" : "#f5f5f5",
                paper: mode === "dark" ? "#1e1e1e" : "#ffffff",
            },
        },
    });

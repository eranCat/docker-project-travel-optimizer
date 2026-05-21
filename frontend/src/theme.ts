import { createTheme } from "@mui/material";

const teal = {
  50:  "#F0FDFA",
  100: "#CCFBF1",
  200: "#99F6E4",
  300: "#5EEAD4",
  400: "#2DD4BF",
  500: "#14B8A6",
  600: "#0D9488",
  700: "#0F766E",
  800: "#115E59",
  900: "#134E4A",
};

const slate = {
  50:  "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#0F172A",
};

const amber = {
  400: "#FBBF24",
  500: "#F59E0B",
};

export const getTheme = (mode: "light" | "dark", direction: "ltr" | "rtl" = "ltr") =>
  createTheme({
    direction,
    palette: {
      mode,
      primary: {
        main:         mode === "dark" ? teal[400]  : teal[700],
        light:        mode === "dark" ? teal[300]  : teal[500],
        dark:         mode === "dark" ? teal[500]  : teal[800],
        contrastText: "#FFFFFF",
      },
      secondary: {
        main:         amber[500],
        light:        amber[400],
        dark:         "#B45309",
        contrastText: "#FFFFFF",
      },
      background: {
        default: mode === "dark" ? "#0B1220" : slate[50],
        paper:   mode === "dark" ? "#111A2E" : "#FFFFFF",
      },
      text: {
        primary:   mode === "dark" ? slate[200] : slate[900],
        secondary: mode === "dark" ? slate[400] : slate[600],
        disabled:  mode === "dark" ? slate[600] : slate[400],
      },
      divider: mode === "dark" ? "#1F2A44" : slate[200],
      success: {
        main: mode === "dark" ? "#4ADE80" : "#16A34A",
      },
      error: {
        main: mode === "dark" ? "#F87171" : "#DC2626",
      },
      warning: {
        main: amber[500],
      },
    },

    typography: {
      fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
      h1: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 700, letterSpacing: "-0.015em" },
      h3: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 600, letterSpacing: "-0.01em" },
      h4: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 600 },
      h5: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 600 },
      h6: { fontFamily: '"Space Grotesk", "Inter", sans-serif', fontWeight: 600 },
      body1:   { fontSize: "0.9375rem", lineHeight: 1.6 },
      body2:   { fontSize: "0.875rem",  lineHeight: 1.55 },
      caption: { fontSize: "0.75rem",   lineHeight: 1.5 },
      button:  { fontWeight: 600, textTransform: "none", letterSpacing: "0.01em" },
    },

    shape: {
      borderRadius: 12,
    },

    shadows: [
      "none",
      "0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)",
      "0 1px 4px rgba(0,0,0,0.07), 0 2px 6px rgba(0,0,0,0.09)",
      "0 2px 8px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.10)",
      "0 4px 12px rgba(0,0,0,0.09), 0 6px 16px rgba(0,0,0,0.10)",
      "0 4px 16px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.12)",
      "0 6px 20px rgba(0,0,0,0.10), 0 10px 28px rgba(0,0,0,0.12)",
      "0 8px 24px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.12)",
      "0 8px 28px rgba(0,0,0,0.11), 0 14px 36px rgba(0,0,0,0.13)",
      "0 10px 32px rgba(0,0,0,0.11), 0 16px 40px rgba(0,0,0,0.13)",
      "0 10px 36px rgba(0,0,0,0.12), 0 18px 44px rgba(0,0,0,0.14)",
      "0 12px 40px rgba(0,0,0,0.12), 0 20px 48px rgba(0,0,0,0.14)",
      "0 12px 44px rgba(0,0,0,0.12), 0 22px 52px rgba(0,0,0,0.14)",
      "0 14px 48px rgba(0,0,0,0.13), 0 24px 56px rgba(0,0,0,0.15)",
      "0 14px 52px rgba(0,0,0,0.13), 0 26px 60px rgba(0,0,0,0.15)",
      "0 16px 56px rgba(0,0,0,0.13), 0 28px 64px rgba(0,0,0,0.15)",
      "0 16px 60px rgba(0,0,0,0.14), 0 30px 68px rgba(0,0,0,0.16)",
      "0 18px 64px rgba(0,0,0,0.14), 0 32px 72px rgba(0,0,0,0.16)",
      "0 18px 68px rgba(0,0,0,0.14), 0 34px 76px rgba(0,0,0,0.17)",
      "0 20px 72px rgba(0,0,0,0.15), 0 36px 80px rgba(0,0,0,0.17)",
      "0 20px 76px rgba(0,0,0,0.15), 0 38px 84px rgba(0,0,0,0.18)",
      "0 22px 80px rgba(0,0,0,0.15), 0 40px 88px rgba(0,0,0,0.18)",
      "0 22px 84px rgba(0,0,0,0.16), 0 42px 92px rgba(0,0,0,0.18)",
      "0 24px 88px rgba(0,0,0,0.16), 0 44px 96px rgba(0,0,0,0.19)",
      "0 24px 92px rgba(0,0,0,0.16), 0 46px 100px rgba(0,0,0,0.20)",
    ],

    components: {
      MuiCssBaseline: {
        styleOverrides: `
          *, *::before, *::after { box-sizing: border-box; }
          html { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
          body { margin: 0; }
          :focus-visible { outline: 2px solid; outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          }
        `,
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 24,
            padding: "8px 20px",
            minHeight: 44,
            fontWeight: 600,
            transition: "background-color 150ms ease, box-shadow 150ms ease, transform 100ms ease",
            "&:active": { transform: "scale(0.97)" },
          }),
          containedPrimary: ({ theme }) => ({
            "&:hover": { backgroundColor: theme.palette.primary.dark },
          }),
          outlined: ({ theme }) => ({
            borderColor: theme.palette.divider,
          }),
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            minWidth: 44,
            minHeight: 44,
            borderRadius: 10,
            transition: "background-color 150ms ease",
          },
        },
      },

      MuiCard: {
        defaultProps: { elevation: 2 },
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            border: `1px solid ${theme.palette.divider}`,
            backgroundImage: "none",
          }),
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },

      MuiTextField: {
        defaultProps: { variant: "outlined", size: "small" },
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              minHeight: 44,
              backgroundColor: theme.palette.background.paper,
              transition: "box-shadow 150ms ease",
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
              },
              "&.Mui-focused": {
                boxShadow: `0 0 0 3px ${theme.palette.mode === "dark" ? "rgba(45,212,191,0.18)" : "rgba(15,118,110,0.15)"}`,
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: theme.palette.primary.main,
                borderWidth: 2,
              },
            },
          }),
        },
      },

      MuiAutocomplete: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 12,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[4],
            marginTop: 4,
          }),
          option: ({ theme }) => ({
            borderRadius: 6,
            margin: "2px 6px",
            padding: "8px 10px",
            minHeight: 44,
          }),
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            borderRadius: 8,
            fontSize: "0.8125rem",
            padding: "6px 10px",
            backgroundColor: theme.palette.mode === "dark" ? slate[700] : slate[800],
          }),
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 20, fontWeight: 500 },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 4, height: 5 },
        },
      },

      MuiCircularProgress: {
        defaultProps: { thickness: 3.5 },
      },

      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({ borderColor: theme.palette.divider }),
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            minHeight: 48,
            transition: "background-color 150ms ease",
          },
        },
      },
    },
  });

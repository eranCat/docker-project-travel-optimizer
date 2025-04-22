import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { getTheme } from "./theme";

const savedMode = localStorage.getItem("theme") as "light" | "dark" || "light";

function Main() {
  const [mode, setMode] = React.useState<"light" | "dark">(savedMode);
  const theme = getTheme(mode);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme", newMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App toggleTheme={toggleTheme} mode={mode} />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<Main />);

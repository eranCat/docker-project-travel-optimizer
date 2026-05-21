import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
import i18n from "./i18n";

import { CssBaseline, ThemeProvider } from "@mui/material";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";
import { prefixer } from "stylis";
import stylisRTLPlugin from "stylis-plugin-rtl";
import { getTheme } from "./theme";

const rtlCache = createCache({ key: "muirtl", stylisPlugins: [prefixer, stylisRTLPlugin] });
const ltrCache = createCache({ key: "muiltr" });

const Main = () => {
  const [mode, setMode] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") || "light"
  );
  const [lang, setLang] = useState<"en" | "he">(
    () => (localStorage.getItem("lang") as "en" | "he") || "en"
  );

  const toggleTheme = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("theme", next);
  };

  const toggleLang = () => {
    const next = lang === "he" ? "en" : "he";
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
    document.documentElement.dir = next === "he" ? "rtl" : "ltr";
    document.documentElement.lang = next;
  };

  const isRtl = lang === "he";
  const theme = useMemo(() => getTheme(mode, isRtl ? "rtl" : "ltr"), [mode, isRtl]);

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App toggleTheme={toggleTheme} mode={mode} toggleLang={toggleLang} />
      </ThemeProvider>
    </CacheProvider>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(<Main />);

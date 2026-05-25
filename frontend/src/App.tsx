import { useTranslation } from "react-i18next";
import MainLayout from "./components/MainLayout";
import MainContent from "./components/MainContent";
import { useBackendHealth } from "./hooks/useBackendHealth";
import "./styles/theme.css";
import DevToolbar from "./components/DevToolbar";

export default function App({
  toggleTheme,
  mode,
  toggleLang,
}: {
  toggleTheme: () => void;
  mode: "light" | "dark";
  toggleLang: () => void;
}) {
  const { t } = useTranslation();
  const backendHealthy = useBackendHealth();
  return (
    <MainLayout
      title={t("app.title")}
      footer=""
      mode={mode}
      toggleTheme={toggleTheme}
      toggleLang={toggleLang}
      backendHealthy={backendHealthy}
    >
      <MainContent backendHealthy={backendHealthy} />
      {import.meta.env.DEV && <DevToolbar />}
    </MainLayout>
  );
}

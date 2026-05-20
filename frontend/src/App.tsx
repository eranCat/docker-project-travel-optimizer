import MainLayout from "./components/MainLayout";
import MainContent from "./components/MainContent";
import { useBackendHealth } from "./hooks/useBackendHealth";
import "./styles/theme.css";

export default function App({ toggleTheme, mode }: { toggleTheme: () => void; mode: "light" | "dark" }) {
  const backendHealthy = useBackendHealth();
  return (
    <MainLayout title="Travel Optimizer" footer="" mode={mode} toggleTheme={toggleTheme} backendHealthy={backendHealthy}>
      <MainContent backendHealthy={backendHealthy} />
    </MainLayout>
  );
}

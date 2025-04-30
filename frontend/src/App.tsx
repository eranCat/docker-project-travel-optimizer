import MainLayout from "./components/MainLayout";
import MainContent from "./components/MainContent";
import "./styles/theme.css";

export default function App({ toggleTheme, mode }: { toggleTheme: () => void; mode: "light" | "dark" }) {
  return (
    <MainLayout title="Travel Optimizer" footer="" mode={mode} toggleTheme={toggleTheme}>
      <MainContent />
    </MainLayout>
  );
}

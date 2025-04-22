import { useEffect, useState } from "react";

export default function DarkModeToggle() {
    const [dark, setDark] = useState(() =>
        localStorage.getItem("theme") === "dark"
    );

    useEffect(() => {
        const root = document.documentElement;
        if (dark) {
            root.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
        }
    }, [dark]);

    return (
        <button
            onClick={() => setDark(!dark)}
            style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "1rem",
                color: "var(--fg)",
            }}
            title="Toggle theme"
        >
            {dark ? "🌞 Light" : "🌙 Dark"}
        </button>
    );
}

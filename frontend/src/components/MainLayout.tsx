import React from "react";
import DarkModeToggle from "./DarkModeToggle";

interface Props {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    centered?: boolean;
    noPadding?: boolean;
}

const MainLayout: React.FC<Props> = ({
    title,
    children,
    footer,
    centered = false,
    noPadding = false,
}) => {
    return (
        <div className="app-wrapper" style={{
            padding: noPadding ? "0" : "1rem",
            maxWidth: centered ? "600px" : "900px",
            margin: "auto",
            fontFamily: "sans-serif"
        }}>
            <DarkModeToggle />
            <h1 className="app-title">{title}</h1>
            {children}
            {footer && (
                <div style={{ marginTop: "2rem", fontSize: "0.9rem", textAlign: "center", opacity: 0.7 }}>
                    {footer}
                </div>
            )}
        </div>
    );
};

export default MainLayout;

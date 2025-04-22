import React from "react";
import DarkModeToggle from "./DarkModeToggle";
import { Typography } from "@mui/material";

interface Props {
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({
    title,
    children,
    footer,
}) => {
    return (
        <div className="app-wrapper" style={{
            padding: "2rem 1rem",
            maxWidth: "900px",
            margin: "auto",
            fontFamily: "Inter, sans-serif"
        }}>
            <h1 className="app-title">{title}</h1>
            {children}
            {footer && (
                <Typography
                    variant="body2"
                    align="center"
                    sx={{ mt: 4, color: "text.secondary" }}
                >
                    {footer}
                </Typography>
            )}
        </div>
    );
};

export default MainLayout;

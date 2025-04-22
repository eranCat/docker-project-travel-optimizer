import React from "react";

const AlertMessage: React.FC<{ message: string }> = ({ message }) => {
    if (!message) return null;

    return (
        <p
            className="app-error"
            style={{
                color: "#b00020",
                background: "rgba(255,0,0,0.05)",
                borderRadius: "6px",
                padding: "0.75rem 1rem",
                margin: "1rem 0",
                border: "1px solid #ffaaaa",
            }}
        >
            ⚠️ {message}
        </p>
    );
};

export default AlertMessage;

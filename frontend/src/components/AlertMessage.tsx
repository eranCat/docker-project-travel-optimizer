import { Alert, AlertTitle } from "@mui/material";

export default function AlertMessage({ message }: { message: string }) {
    if (!message) return null;

    return (
        <Alert severity="error">
            <AlertTitle>Error</AlertTitle>
            <span style={{ whiteSpace: "pre-line" }}>{message}</span>
        </Alert>
    );
}

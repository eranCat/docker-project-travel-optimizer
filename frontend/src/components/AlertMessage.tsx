import React from "react";
import { Alert, Collapse } from "@mui/material";

const AlertMessage = ({ message }: { message: string }) => (
    <Collapse in={!!message}>
        {message && (
            <Alert severity="error" sx={{ my: 2 }}>
                {message}
            </Alert>
        )}
    </Collapse>
);

export default AlertMessage;

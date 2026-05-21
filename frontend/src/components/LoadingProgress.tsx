import { Box, Typography, LinearProgress } from "@mui/material";

interface LoadingProgressProps {
    loading: boolean;
    stages: string[];
    stage: number;
}

export default function LoadingProgress({ loading, stages, stage }: LoadingProgressProps) {
    if (!loading) return null;

    return (
        <Box sx={{ width: "100%", mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {stages[stage] ?? "Loading..."}
            </Typography>
            <LinearProgress
                variant="determinate"
                value={Math.min(((stage + 1) / stages.length) * 100, 100)}
            />
        </Box>
    );
}

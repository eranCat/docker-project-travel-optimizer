import { Box, Typography, LinearProgress, Fade } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

interface LoadingProgressProps {
    loading: boolean;
    stages: string[];
    stage: number;
}

export default function LoadingProgress({ loading, stages, stage }: LoadingProgressProps) {
    if (!loading) return null;

    const progress = stages.length > 0 ? Math.min(((stage + 1) / stages.length) * 100, 100) : 0;
    const label = stages[stage] ?? "Loading...";

    return (
        <Fade in={loading}>
            <Box
                sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "primary.main",
                    backgroundImage: (theme) =>
                        theme.palette.mode === "dark"
                            ? "linear-gradient(135deg, rgba(45,212,191,0.15) 0%, rgba(15,118,110,0.08) 100%)"
                            : "linear-gradient(135deg, rgba(15,118,110,0.08) 0%, rgba(204,251,241,0.5) 100%)",
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "primary.main",
                    borderLeftWidth: 3,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <AutoAwesomeIcon
                        sx={{
                            fontSize: 16,
                            color: "primary.main",
                            animation: "spin 1.5s linear infinite",
                            "@keyframes spin": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
                        }}
                    />
                    <Typography variant="body2" fontWeight={500} color="primary.main" noWrap>
                        {label}
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        borderRadius: 4,
                        height: 4,
                        bgcolor: (theme) =>
                            theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(15,118,110,0.12)",
                        "& .MuiLinearProgress-bar": { borderRadius: 4 },
                    }}
                />
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
                    Step {stage + 1} of {stages.length}
                </Typography>
            </Box>
        </Fade>
    );
}

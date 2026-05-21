import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Typography, LinearProgress, Fade } from "@mui/material";
import LoopIcon from "@mui/icons-material/Loop";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

interface LoadingProgressProps {
    loading: boolean;
    stages: string[];
    stage: number;
    detail?: { tags?: number; pois?: number; routes?: number };
}

// Map a stage index to its live-count line (when the backend has reported one).
function stageDetail(
    index: number,
    detail: LoadingProgressProps["detail"],
): { key: string; count: number } | null {
    if (!detail) return null;
    if (index === 0 && detail.tags != null) return { key: "loading.tags", count: detail.tags };
    if (index === 1 && detail.pois != null) return { key: "loading.places", count: detail.pois };
    if (index === 3 && detail.routes != null) return { key: "loading.routesBuilt", count: detail.routes };
    return null;
}

export default function LoadingProgress({ loading, stages, stage, detail }: LoadingProgressProps) {
    const { t } = useTranslation();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!loading) {
            setElapsed(0);
            return;
        }
        const start = Date.now();
        const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
        return () => clearInterval(id);
    }, [loading]);

    if (!loading) return null;

    const progress = stages.length > 0 ? Math.min(((stage + 1) / stages.length) * 100, 100) : 0;

    return (
        <Fade in={loading}>
            <Box
                sx={{
                    mb: 2,
                    p: 1.5,
                    borderRadius: 2,
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
                {/* Header: step counter + elapsed timer */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="primary.main">
                        {t("loading.step", { current: Math.min(stage + 1, stages.length), total: stages.length })}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                        {t("loading.elapsed", { seconds: elapsed })}
                    </Typography>
                </Box>

                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        borderRadius: 4,
                        height: 4,
                        mb: 1.25,
                        bgcolor: (theme) =>
                            theme.palette.mode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(15,118,110,0.12)",
                        "& .MuiLinearProgress-bar": { borderRadius: 4 },
                    }}
                />

                {/* Per-stage checklist */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    {stages.map((rawLabel, i) => {
                        const done = i < stage;
                        const active = i === stage;
                        const label = t(`stage.${rawLabel}`, { defaultValue: rawLabel });
                        const sub = stageDetail(i, detail);
                        return (
                            <Box key={rawLabel} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                                {done ? (
                                    <CheckCircleIcon sx={{ fontSize: 16, color: "primary.main", mt: "1px" }} />
                                ) : active ? (
                                    <LoopIcon
                                        sx={{
                                            fontSize: 16,
                                            color: "primary.main",
                                            mt: "1px",
                                            animation: "spin 1.2s linear infinite",
                                            "@keyframes spin": { from: { transform: "rotate(360deg)" }, to: { transform: "rotate(0deg)" } },
                                        }}
                                    />
                                ) : (
                                    <RadioButtonUncheckedIcon sx={{ fontSize: 16, color: "text.disabled", mt: "1px" }} />
                                )}
                                <Box sx={{ minWidth: 0 }}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={active ? 600 : 400}
                                        color={done || active ? "text.primary" : "text.disabled"}
                                        sx={{ lineHeight: 1.3 }}
                                    >
                                        {label}
                                    </Typography>
                                    {sub && (
                                        <Typography variant="caption" color="primary.main" sx={{ display: "block", lineHeight: 1.3 }}>
                                            {t(sub.key, { count: sub.count })}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        </Fade>
    );
}

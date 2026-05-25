import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Box, Chip, Collapse, IconButton, Paper, Tooltip, Typography,
} from "@mui/material";
import BugReportIcon from "@mui/icons-material/BugReport";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { testCache, testGroq, testORS, testOverpass, TestResult } from "../services/API";

interface ServiceStatus {
    label: string;
    result: TestResult | null;
    loading: boolean;
}

const statusColor = (s: ServiceStatus): "success" | "error" | "default" =>
    s.loading ? "default" : s.result?.ok ? "success" : "error";

const latencyLabel = (s: ServiceStatus) => {
    if (s.loading) return "…";
    if (!s.result) return "—";
    if (!s.result.ok) return "✗";
    return `${s.result.latency_s}s`;
};

export default function DevToolbar() {
    const [expanded, setExpanded] = useState(false);
    const [services, setServices] = useState<Record<string, ServiceStatus>>({
        groq: { label: "Groq", result: null, loading: false },
        overpass: { label: "Overpass", result: null, loading: false },
        ors: { label: "ORS", result: null, loading: false },
        cache: { label: "Cache", result: null, loading: false },
    });
    const abortRef = useRef<AbortController | null>(null);

    const run = useCallback(async () => {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const setLoading = (keys: string[]) =>
            setServices(prev => {
                const next = { ...prev };
                keys.forEach(k => { next[k] = { ...next[k], loading: true, result: null }; });
                return next;
            });

        const setResult = (key: string, result: TestResult) =>
            setServices(prev => ({ ...prev, [key]: { ...prev[key], loading: false, result } }));

        setLoading(["groq", "overpass", "ors", "cache"]);

        const wrap = async (key: string, fn: () => Promise<TestResult>) => {
            try { setResult(key, await fn()); }
            catch (e: any) { setResult(key, { ok: false, error: String(e) }); }
        };

        await Promise.all([
            wrap("groq", testGroq),
            wrap("overpass", testOverpass),
            wrap("ors", testORS),
            wrap("cache", testCache),
        ]);
    }, []);

    useEffect(() => { run(); }, [run]);

    const cacheResult = services.cache.result as any;
    const cacheCount = cacheResult?.total_entries ?? "—";

    return (
        <Paper
            elevation={6}
            sx={{
                position: "fixed",
                bottom: 12,
                right: 12,
                zIndex: 9999,
                border: "2px solid",
                borderColor: "warning.main",
                borderRadius: 2,
                bgcolor: "background.paper",
                width: 160,
            }}
        >
            {/* Collapsed bar */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, px: 1, py: 0.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <BugReportIcon sx={{ fontSize: 14, color: "warning.main" }} />
                    <Typography variant="caption" fontWeight={700} sx={{ color: "warning.main", fontSize: "0.7rem" }}>
                        DEV
                    </Typography>
                </Box>

                {["groq", "overpass", "ors"].map(key => (
                    <Chip
                        key={key}
                        label={`${services[key].label} ${latencyLabel(services[key])}`}
                        size="small"
                        color={statusColor(services[key])}
                        variant={services[key].loading ? "outlined" : "filled"}
                        sx={{ fontSize: 11, height: 22 }}
                    />
                ))}

                <Chip
                    label={`Cache ${cacheCount}`}
                    size="small"
                    color={statusColor(services.cache)}
                    variant={services.cache.loading ? "outlined" : "filled"}
                    sx={{ fontSize: 11, height: 22 }}
                />

                <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
                    <Tooltip title="Re-run probes">
                        <IconButton size="small" onClick={run} sx={{ p: 0.25 }}>
                            <RefreshIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => setExpanded(e => !e)} sx={{ p: 0.25 }}>
                        {expanded ? <ExpandMoreIcon sx={{ fontSize: 16 }} /> : <ExpandLessIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                </Box>
            </Box>

            {/* Expanded details */}
            <Collapse in={expanded}>
                <Box sx={{ px: 2, pb: 1.5, pt: 0.5, display: "flex", flexDirection: "column", gap: 1 }}>
                    {["groq", "overpass", "ors"].map(key => {
                        const s = services[key];
                        const r = s.result as any;
                        return (
                            <Box key={key}>
                                <Typography variant="caption" fontWeight={700}>{s.label}</Typography>
                                {s.loading && <Typography variant="caption" display="block" color="text.secondary">pinging…</Typography>}
                                {!s.loading && r && (
                                    <>
                                        <Typography variant="caption" display="block" color={r.ok ? "success.main" : "error.main"}>
                                            {r.ok ? `✓ ${r.latency_s}s` : `✗ ${r.error ?? "failed"}`}
                                        </Typography>
                                        {key === "groq" && r.tags && (
                                            <Typography variant="caption" display="block" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                                                {r.tags.map((t: any) => `${t.key}=${t.value}`).join(", ")}
                                            </Typography>
                                        )}
                                        {key === "overpass" && r.element_count !== undefined && (
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                {r.element_count} elements via {r.mirror_used?.replace("https://", "")}
                                            </Typography>
                                        )}
                                        {key === "ors" && r.duration_s !== undefined && (
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                route duration {Math.round(r.duration_s)}s
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </Box>
                        );
                    })}

                    {/* Cache entries */}
                    <Box>
                        <Typography variant="caption" fontWeight={700}>Cache</Typography>
                        {services.cache.loading && <Typography variant="caption" display="block" color="text.secondary">loading…</Typography>}
                        {!services.cache.loading && cacheResult && (
                            <>
                                <Typography variant="caption" display="block" color="text.secondary">
                                    {cacheResult.total_entries} entries (TTL {cacheResult.cache_ttl_s}s)
                                </Typography>
                                {(cacheResult.entries ?? []).slice(0, 5).map((e: any, i: number) => (
                                    <Typography key={i} variant="caption" display="block" color="text.secondary" noWrap>
                                        {e.location} r={e.radius_km}km → {e.poi_count} POIs, {Math.round(e.ttl_remaining_s)}s left
                                    </Typography>
                                ))}
                            </>
                        )}
                    </Box>
                </Box>
            </Collapse>
        </Paper>
    );
}

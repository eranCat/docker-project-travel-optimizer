import { useEffect, useState } from "react";
import { checkHealth } from "../services/API";
import { isGenerationActive } from "../services/generationState";

const POLL_HEALTHY_MS = 30_000;
const POLL_UNHEALTHY_MS = 10_000;

export function useBackendHealth(): boolean | null {
    const [healthy, setHealthy] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;
        let failures = 0;

        async function check() {
            // An active SSE generation already proves the backend is alive —
            // skip polling to avoid false negatives from a busy backend.
            if (isGenerationActive()) {
                failures = 0;
                setHealthy(true);
                timer = setTimeout(check, POLL_UNHEALTHY_MS);
                return;
            }
            const ok = await checkHealth();
            if (cancelled) return;
            if (ok || isGenerationActive()) {
                failures = 0;
                setHealthy(true);
            } else {
                // Require 2 consecutive failures before flagging unhealthy —
                // avoids false positives from a single transient timeout.
                failures += 1;
                if (failures >= 2) setHealthy(false);
            }
            timer = setTimeout(check, ok ? POLL_HEALTHY_MS : POLL_UNHEALTHY_MS);
        }

        check();
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, []);

    return healthy;
}

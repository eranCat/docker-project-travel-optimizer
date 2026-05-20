import { useEffect, useState } from "react";
import { checkHealth } from "../services/API";

const POLL_HEALTHY_MS = 30_000;
const POLL_UNHEALTHY_MS = 10_000;

export function useBackendHealth(): boolean | null {
    const [healthy, setHealthy] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;
        let failures = 0;

        async function check() {
            const ok = await checkHealth();
            if (cancelled) return;
            if (ok) {
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

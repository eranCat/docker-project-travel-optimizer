import { useEffect, useState } from "react";
import { checkHealth } from "../services/API";

const POLL_HEALTHY_MS = 30_000;
const POLL_UNHEALTHY_MS = 10_000;

export function useBackendHealth(): boolean | null {
    const [healthy, setHealthy] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;

        async function check() {
            const ok = await checkHealth();
            if (cancelled) return;
            setHealthy(ok);
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

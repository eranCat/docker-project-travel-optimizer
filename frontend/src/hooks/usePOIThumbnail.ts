import { useState, useEffect } from "react";

const _cache = new Map<string, string | null>();

export function usePOIThumbnail(wikiTitle: string | undefined): string | null {
    const [url, setUrl] = useState<string | null>(() => {
        if (!wikiTitle) return null;
        return _cache.has(wikiTitle) ? (_cache.get(wikiTitle) ?? null) : null;
    });

    useEffect(() => {
        if (!wikiTitle) return;
        if (_cache.has(wikiTitle)) {
            setUrl(_cache.get(wikiTitle) ?? null);
            return;
        }

        const colonIdx = wikiTitle.indexOf(":");
        if (colonIdx === -1) return;
        const lang = wikiTitle.slice(0, colonIdx);
        const title = wikiTitle.slice(colonIdx + 1);
        if (!title) return;

        const controller = new AbortController();
        fetch(
            `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
            { signal: controller.signal }
        )
            .then((r) => r.json())
            .then((data) => {
                const imgUrl: string | null = data?.thumbnail?.source ?? null;
                _cache.set(wikiTitle, imgUrl);
                setUrl(imgUrl);
            })
            .catch(() => {
                _cache.set(wikiTitle, null);
            });

        return () => controller.abort();
    }, [wikiTitle]);

    return url;
}

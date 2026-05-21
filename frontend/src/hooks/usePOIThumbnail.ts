import { useState, useEffect } from "react";

const _cache = new Map<string, string | null>();

async function fetchWikiThumbnail(wikiTitle: string, signal: AbortSignal): Promise<string | null> {
    const colonIdx = wikiTitle.indexOf(":");
    if (colonIdx === -1) return null;
    const lang = wikiTitle.slice(0, colonIdx);
    const title = wikiTitle.slice(colonIdx + 1);
    if (!title) return null;

    const r = await fetch(
        `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { signal }
    );
    const data = await r.json();
    return data?.thumbnail?.source ?? null;
}

async function fetchWikidataThumbnail(qid: string, signal: AbortSignal): Promise<string | null> {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}&props=claims&format=json&origin=*`;
    const r = await fetch(url, { signal });
    const data = await r.json();
    const filename: string | undefined =
        data?.entities?.[qid]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    if (!filename) return null;
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}?width=200`;
}

export function usePOIThumbnail(
    wikiTitle: string | undefined,
    wikidataId: string | undefined,
): string | null {
    const cacheKey = wikiTitle ?? wikidataId ?? "";

    const [url, setUrl] = useState<string | null>(() => {
        if (!cacheKey) return null;
        return _cache.has(cacheKey) ? (_cache.get(cacheKey) ?? null) : null;
    });

    useEffect(() => {
        if (!cacheKey) return;
        if (_cache.has(cacheKey)) {
            setUrl(_cache.get(cacheKey) ?? null);
            return;
        }

        const controller = new AbortController();

        (async () => {
            try {
                let imgUrl: string | null = null;

                if (wikiTitle) {
                    imgUrl = await fetchWikiThumbnail(wikiTitle, controller.signal);
                }

                if (!imgUrl && wikidataId) {
                    imgUrl = await fetchWikidataThumbnail(wikidataId, controller.signal);
                }

                _cache.set(cacheKey, imgUrl);
                setUrl(imgUrl);
            } catch {
                _cache.set(cacheKey, null);
            }
        })();

        return () => controller.abort();
    }, [cacheKey, wikiTitle, wikidataId]);

    return url;
}

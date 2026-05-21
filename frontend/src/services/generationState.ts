// Tracks whether a route-generation SSE stream is currently active.
// An open SSE connection already proves the backend is reachable, so the
// health poller pauses while generation is in flight to avoid false
// "backend unavailable" banners caused by a busy/slow backend.
let active = false;

export const setGenerationActive = (v: boolean) => {
    active = v;
};

export const isGenerationActive = () => active;

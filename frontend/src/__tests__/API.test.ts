import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// --- fetchLocationSuggestions ---

describe('fetchLocationSuggestions', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('returns results from axios on success', async () => {
        vi.doMock('axios', () => ({
            default: {
                create: () => ({}),
                get: vi.fn().mockResolvedValue({ data: [{ display_name: 'Tel Aviv' }] }),
            },
        }));
        const mod = await import('../services/API');
        const results = await mod.fetchLocationSuggestions('tel');
        expect(Array.isArray(results)).toBe(true);
    });
});

// --- logToServer ---

describe('logToServer', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
        // Provide VITE env var
        vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:8000' } });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    it('calls fetch with POST and correct content-type', async () => {
        const { logToServer } = await import('../services/API');
        logToServer('info', 'test message', { key: 'val' });
        // Give microtasks a tick
        await new Promise(r => setTimeout(r, 0));
        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/frontend-log'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            })
        );
    });

    it('does not throw when fetch fails', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));
        const { logToServer } = await import('../services/API');
        expect(() => logToServer('error', 'fail')).not.toThrow();
    });
});

// --- routeProgress ---

describe('routeProgress', () => {
    it('returns an EventSource instance', async () => {
        vi.stubGlobal('EventSource', class MockEventSource {
            url: string;
            constructor(url: string) { this.url = url; }
        });
        vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:8000' } });
        vi.resetModules();

        const { routeProgress } = await import('../services/API');
        const source = routeProgress({
            interests: 'history',
            location: 'Paris',
            radius_km: 5,
            num_routes: 2,
            num_pois: 4,
            travel_mode: 'walking',
        });
        expect(source).toBeDefined();
        vi.unstubAllGlobals();
    });

    it('includes all required params in URL', async () => {
        let capturedUrl = '';
        vi.stubGlobal('EventSource', class MockEventSource {
            constructor(url: string) { capturedUrl = url; }
        });
        vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:8000' } });
        vi.resetModules();

        const { routeProgress } = await import('../services/API');
        routeProgress({
            interests: 'art',
            location: 'Berlin',
            radius_km: 3,
            num_routes: 1,
            num_pois: 5,
            travel_mode: 'cycling',
        });
        expect(capturedUrl).toContain('interests=art');
        expect(capturedUrl).toContain('location=Berlin');
        expect(capturedUrl).toContain('radius_km=3');
        expect(capturedUrl).toContain('travel_mode=cycling');
        vi.unstubAllGlobals();
    });

    it('includes lat/lon in URL when provided', async () => {
        let capturedUrl = '';
        vi.stubGlobal('EventSource', class MockEventSource {
            constructor(url: string) { capturedUrl = url; }
        });
        vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:8000' } });
        vi.resetModules();

        const { routeProgress } = await import('../services/API');
        routeProgress({
            interests: 'food',
            location: 'TLV',
            radius_km: 2,
            num_routes: 1,
            num_pois: 3,
            travel_mode: 'walking',
            latitude: 32.08,
            longitude: 34.78,
        });
        expect(capturedUrl).toContain('latitude=32.08');
        expect(capturedUrl).toContain('longitude=34.78');
        vi.unstubAllGlobals();
    });

    it('omits lat/lon when not provided', async () => {
        let capturedUrl = '';
        vi.stubGlobal('EventSource', class MockEventSource {
            constructor(url: string) { capturedUrl = url; }
        });
        vi.stubGlobal('import.meta', { env: { VITE_API_BASE_URL: 'http://localhost:8000' } });
        vi.resetModules();

        const { routeProgress } = await import('../services/API');
        routeProgress({
            interests: 'food',
            location: 'TLV',
            radius_km: 2,
            num_routes: 1,
            num_pois: 3,
            travel_mode: 'walking',
        });
        expect(capturedUrl).not.toContain('latitude');
        expect(capturedUrl).not.toContain('longitude');
        vi.unstubAllGlobals();
    });
});

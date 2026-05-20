import { describe, it, expect } from 'vitest';
import { createSearchQuery } from '../utils/createSearchQuery';
import { POI } from '../models/POI';

const poi = (overrides: Partial<POI> = {}): POI => ({
    name: 'Test Place',
    latitude: 32.0,
    longitude: 34.0,
    ...overrides,
});

describe('createSearchQuery', () => {
    it('returns a Google Maps search URL', () => {
        const url = createSearchQuery(poi());
        expect(url).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    });

    it('encodes POI name in query', () => {
        const url = createSearchQuery(poi({ name: 'Café Renault' }));
        expect(url).toContain(encodeURIComponent('Café Renault'));
    });

    it('includes category when present', () => {
        const url = createSearchQuery(poi({ name: 'Louvre', categories: ['museum'] }));
        expect(url).toContain(encodeURIComponent('museum'));
    });

    it('includes address when present', () => {
        const url = createSearchQuery(poi({ name: 'X', address: '10 Rue de Rivoli' }));
        expect(url).toContain(encodeURIComponent('10 Rue de Rivoli'));
    });

    it('omits category/address when absent', () => {
        const url = createSearchQuery(poi({ name: 'Solo Place' }));
        // Should just encode the name, no extra separators
        expect(decodeURIComponent(url.split('query=')[1])).toBe('Solo Place');
    });

    it('uses only first category', () => {
        const url = createSearchQuery(poi({ name: 'X', categories: ['museum', 'attraction'] }));
        const query = decodeURIComponent(url.split('query=')[1]);
        expect(query).toContain('museum');
        expect(query).not.toContain('attraction');
    });

    it('handles special characters in name', () => {
        const url = createSearchQuery(poi({ name: 'בית קפה & Co.' }));
        expect(url).toContain(encodeURIComponent('בית קפה & Co.'));
    });
});

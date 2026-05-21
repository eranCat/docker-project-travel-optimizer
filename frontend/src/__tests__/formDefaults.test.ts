import { describe, it, expect } from 'vitest';
import { DEFAULT_FORM, FORM_VERSION } from '../constants/formDefaults';

describe('DEFAULT_FORM', () => {
    it('has required string fields', () => {
        expect(typeof DEFAULT_FORM.interests).toBe('string');
        expect(typeof DEFAULT_FORM.location).toBe('string');
        expect(typeof DEFAULT_FORM.travel_mode).toBe('string');
    });

    it('has positive numeric defaults', () => {
        expect(DEFAULT_FORM.radius_km).toBeGreaterThan(0);
        expect(DEFAULT_FORM.num_routes).toBeGreaterThan(0);
        expect(DEFAULT_FORM.num_pois).toBeGreaterThan(0);
    });

    it('travel_mode is valid walking/driving/cycling', () => {
        expect(['walking', 'driving', 'cycling']).toContain(DEFAULT_FORM.travel_mode);
    });

    it('latitude and longitude are undefined by default', () => {
        expect(DEFAULT_FORM.latitude).toBeUndefined();
        expect(DEFAULT_FORM.longitude).toBeUndefined();
    });

    it('interests and location are empty strings by default', () => {
        expect(DEFAULT_FORM.interests).toBe('');
        expect(DEFAULT_FORM.location).toBe('');
    });
});

describe('FORM_VERSION', () => {
    it('is a positive integer', () => {
        expect(Number.isInteger(FORM_VERSION)).toBe(true);
        expect(FORM_VERSION).toBeGreaterThan(0);
    });
});

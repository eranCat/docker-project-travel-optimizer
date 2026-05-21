import { describe, it, expect } from 'vitest';
import { detectDirectionFromText } from '../utils/detectDirectionFromText';

describe('detectDirectionFromText', () => {
    it('returns ltr for empty string', () => {
        expect(detectDirectionFromText('')).toBe('ltr');
    });

    it('returns ltr for ASCII text', () => {
        expect(detectDirectionFromText('Hello World')).toBe('ltr');
    });

    it('returns ltr for numbers only', () => {
        expect(detectDirectionFromText('12345')).toBe('ltr');
    });

    it('returns rtl for Hebrew text', () => {
        expect(detectDirectionFromText('שלום')).toBe('rtl');
    });

    it('returns rtl for Arabic text', () => {
        expect(detectDirectionFromText('مرحبا')).toBe('rtl');
    });

    it('returns rtl for mixed Hebrew + Latin', () => {
        // Hebrew char present → rtl
        expect(detectDirectionFromText('Beer Sheva באר שבע')).toBe('rtl');
    });

    it('returns ltr for emoji only', () => {
        expect(detectDirectionFromText('🎉🎊')).toBe('ltr');
    });

    it('returns rtl for Hebrew address with numbers', () => {
        expect(detectDirectionFromText('רחוב הרצל 5')).toBe('rtl');
    });
});

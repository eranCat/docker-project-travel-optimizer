import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from '../hooks/usePersistedState';

beforeEach(() => {
    localStorage.clear();
});

describe('usePersistedState', () => {
    it('returns default value when key absent', () => {
        const { result } = renderHook(() => usePersistedState('k', 42));
        expect(result.current[0]).toBe(42);
    });

    it('returns stored value when key present', () => {
        localStorage.setItem('k', JSON.stringify(99));
        const { result } = renderHook(() => usePersistedState('k', 0));
        expect(result.current[0]).toBe(99);
    });

    it('persists new value to localStorage on set', () => {
        const { result } = renderHook(() => usePersistedState('k', 'initial'));
        act(() => result.current[1]('updated'));
        expect(localStorage.getItem('k')).toBe(JSON.stringify('updated'));
    });

    it('removes key when set to undefined', () => {
        localStorage.setItem('k', JSON.stringify('old'));
        const { result } = renderHook(() => usePersistedState<string | undefined>('k', 'default'));
        act(() => result.current[1](undefined));
        expect(localStorage.getItem('k')).toBeNull();
    });

    it('handles corrupt JSON by resetting to default', () => {
        localStorage.setItem('k', 'not-valid-json{{{');
        const { result } = renderHook(() => usePersistedState('k', 'fallback'));
        expect(result.current[0]).toBe('fallback');
        expect(localStorage.getItem('k')).toBeNull();
    });

    it('accepts functional updater', () => {
        const { result } = renderHook(() => usePersistedState('k', 10));
        act(() => result.current[1](prev => prev + 5));
        expect(result.current[0]).toBe(15);
        expect(localStorage.getItem('k')).toBe(JSON.stringify(15));
    });

    it('sets travel-form-time when key is travel-form', () => {
        const { result } = renderHook(() => usePersistedState('travel-form', { x: 1 }));
        act(() => result.current[1]({ x: 2 }));
        expect(localStorage.getItem('travel-form-time')).not.toBeNull();
    });

    it('does not set travel-form-time for other keys', () => {
        const { result } = renderHook(() => usePersistedState('other-key', 1));
        act(() => result.current[1](2));
        expect(localStorage.getItem('travel-form-time')).toBeNull();
    });

    it('works with object values', () => {
        const def = { a: 1, b: 'x' };
        const { result } = renderHook(() => usePersistedState('obj', def));
        act(() => result.current[1]({ a: 2, b: 'y' }));
        expect(result.current[0]).toEqual({ a: 2, b: 'y' });
    });
});

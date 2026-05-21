import { useState } from "react";

type SetStateAction<T> = T | ((prevState: T) => T);

export function usePersistedState<T>(key: string, defaultValue: T): [T, (value: SetStateAction<T>) => void] {
    const [state, setState] = useState<T>(() => {
        const storedValue = localStorage.getItem(key);
        if (!storedValue || storedValue === "undefined") {
            return defaultValue;
        }

        try {
            return JSON.parse(storedValue) as T;
        } catch (err) {
            console.warn(`Invalid persisted value for key '${key}', resetting to default.`, err);
            localStorage.removeItem(key);
            return defaultValue;
        }
    });

    const setPersistedState = (value: SetStateAction<T>) => {
        setState(prev => {
            const newValue = typeof value === "function" ? (value as (prevState: T) => T)(prev) : value;
            if (newValue === undefined) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(newValue));
            }

            if (key === "travel-form") {
                localStorage.setItem("travel-form-time", Date.now().toString());
            }

            return newValue;
        });
    };

    return [state, setPersistedState];
}
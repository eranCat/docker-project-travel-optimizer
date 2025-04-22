import { useState } from "react";

export function usePersistedState<T>(key: string, defaultValue: T): [T, (val: T) => void] {
    const saved = localStorage.getItem(key);
    let parsed = defaultValue;

    try {
        if (saved && saved !== "undefined") {
            parsed = JSON.parse(saved);
        }
    } catch (e) {
        console.warn(`Failed to parse ${key} from localStorage:`, e);
    }

    const [value, setValue] = useState<T>(parsed);

    const update = (val: T) => {
        setValue(val);
        localStorage.setItem(key, JSON.stringify(val));
    };

    return [value, update];
}

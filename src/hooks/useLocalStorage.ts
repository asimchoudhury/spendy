"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const valueRef = useRef<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as T;
        valueRef.current = parsed;
        setValue(parsed);
      }
    } catch {
      // ignore parse errors
    }
    setIsLoaded(true);
  }, [key]);

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)): { quotaExceeded: boolean } => {
      const resolved =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(valueRef.current)
          : newValue;

      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch (err) {
        if (
          err instanceof DOMException &&
          (err.name === "QuotaExceededError" ||
            err.name === "NS_ERROR_DOM_QUOTA_REACHED")
        ) {
          return { quotaExceeded: true };
        }
        // Non-quota error — still update in-memory state
      }

      valueRef.current = resolved;
      setValue(resolved);
      return { quotaExceeded: false };
    },
    [key]
  );

  return [value, setStoredValue, isLoaded] as const;
}

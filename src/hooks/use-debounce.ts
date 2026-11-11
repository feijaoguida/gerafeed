"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook to debounce a value by a specified delay in milliseconds.
 * Delays updating the debounced value until the user pauses typing, preventing
 * excessive API calls on search and filter inputs.
 */
export function useDebounce<T>(value: T, delay = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}


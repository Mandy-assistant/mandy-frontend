"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Matches a media query after hydration (false on the server). */
export const useMediaQuery = (query: string) => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
};

export const useIsMobile = () => useMediaQuery("(max-width: 639px)");
/** Touch-first device: enables swipe gestures. */
export const useCoarsePointer = () => useMediaQuery("(pointer: coarse)");

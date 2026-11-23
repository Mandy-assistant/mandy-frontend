"use client";

import { useSyncExternalStore } from "react";

const subscribe = (query: string) => (onChange: () => void) => {
  const mql = window.matchMedia(query);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
};

/** false on the server and during hydration. */
export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    subscribe(query),
    () => window.matchMedia(query).matches,
    () => false,
  );

/** Phones (below Tailwind's `md`). */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");

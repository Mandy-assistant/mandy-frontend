"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** false on the server and during hydration, true afterwards. Use for time- or device-dependent copy. */
export const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

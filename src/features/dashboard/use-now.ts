"use client";

import { useEffect, useState } from "react";

/** The current time, refreshed every `everyMs`. `null` until hydrated (never read the clock while prerendering). */
export const useNow = (everyMs = 30_000) => {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is only read on the client
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs]);
  return now;
};

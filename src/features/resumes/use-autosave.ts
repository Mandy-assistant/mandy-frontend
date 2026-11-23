"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resumesApi } from "./api";
import { useUpdateResume } from "./hooks";
import type { ResumePatch } from "./types";

export type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

/**
 * Debounced (1s) PATCH of the editor draft. Edits made while a save is in flight are saved right after.
 * `flush()` saves immediately (before printing, saving a version, leaving the page).
 */
export const useAutosave = (id: string, draft: ResumePatch, revision: number, delay = 1000) => {
  const { mutateAsync } = useUpdateResume(id);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const latest = useRef(draft);
  const saved = useRef(revision);
  const current = useRef(revision);
  const inFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    latest.current = draft;
    current.current = revision;
  }, [draft, revision]);

  const save = useCallback(async (): Promise<void> => {
    for (;;) {
      if (inFlight.current) {
        await inFlight.current;
        continue;
      }
      if (current.current === saved.current) return;
      const rev = current.current;
      setStatus("saving");
      const attempt = mutateAsync(latest.current)
        .then(() => {
          saved.current = rev;
          return true;
        })
        .catch(() => false);
      inFlight.current = attempt.then(() => undefined);
      const ok = await attempt;
      inFlight.current = null;
      if (!ok) {
        setStatus("error");
        return;
      }
      // Typed more while saving: loop and save again.
      if (current.current === rev) {
        setStatus("saved");
        return;
      }
    }
  }, [mutateAsync]);

  useEffect(() => {
    if (revision === saved.current) return;
    setStatus((s) => (s === "saving" ? s : "pending"));
    const t = setTimeout(() => void save(), delay);
    return () => clearTimeout(t);
  }, [revision, delay, save]);

  // Leaving the page (or the route going hidden): don't lose the last second of typing.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (current.current !== saved.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      if (current.current !== saved.current) {
        saved.current = current.current;
        void resumesApi.update(id, latest.current).catch(() => {});
      }
    };
  }, [id]);

  /** Mark the current revision as already on the server (e.g. after a restore). */
  const markSaved = useCallback((rev: number) => {
    saved.current = rev;
    current.current = rev;
    setStatus("saved");
  }, []);

  return { status, flush: save, retry: save, markSaved };
};

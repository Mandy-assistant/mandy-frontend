"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const POMODORO_MS = 25 * 60_000;
const STORAGE_KEY = "mandy:pomodoro";

export type PomodoroStatus = "idle" | "running" | "paused" | "finished";

type State = {
  status: PomodoroStatus;
  /** Effective start: `now - anchor` is the elapsed focus time while running (shifted forward on resume). */
  anchor: number;
  pausedAt: number | null;
  /** Wall-clock time of the first start, sent as `started_at`. */
  firstStartedAt: number;
  taskId: string | null;
};

export type FinishedSession = { task_id: string | null; duration_minutes: number; started_at: string; ended_at: string };

const IDLE: State = { status: "idle", anchor: 0, pausedAt: null, firstStartedAt: 0, taskId: null };

const read = (): State => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return IDLE;
    const s = JSON.parse(raw) as Partial<State>;
    if (!s || typeof s.anchor !== "number" || !["idle", "running", "paused", "finished"].includes(String(s.status))) return IDLE;
    return { ...IDLE, ...s } as State;
  } catch {
    return IDLE;
  }
};

const write = (s: State) => {
  try {
    if (s.status === "idle") window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage blocked: the timer still works for this visit */
  }
};

const elapsedAt = (s: State, now: number) =>
  s.status === "running"
    ? now - s.anchor
    : s.status === "paused"
      ? (s.pausedAt ?? now) - s.anchor
      : s.status === "finished"
        ? POMODORO_MS
        : 0;

/**
 * 25-minute focus timer. Stores timestamps (not a counter) in localStorage, so it stays correct
 * across tab switches, sleeps and reloads, and stays in sync between tabs.
 */
export const usePomodoro = ({ onFinish }: { onFinish: (s: FinishedSession) => void }) => {
  const [state, setState] = useState<State>(IDLE);
  const [now, setNow] = useState(0);
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });

  const commit = useCallback((next: State) => {
    write(next);
    setState(next);
    setNow(Date.now());
  }, []);

  // Restore after hydration and follow other tabs.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from localStorage after hydration
    setState(read());
    setNow(Date.now());
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setState(read());
      setNow(Date.now());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Tick every second while running; finish (once) when the time is up.
  useEffect(() => {
    if (state.status !== "running") return;
    const check = () => {
      const t = Date.now();
      if (t - state.anchor >= POMODORO_MS) {
        const finished: State = { ...state, status: "finished", pausedAt: null };
        write(finished);
        setState(finished);
        setNow(t);
        onFinishRef.current({
          task_id: state.taskId,
          duration_minutes: Math.round(POMODORO_MS / 60_000),
          started_at: new Date(state.firstStartedAt).toISOString(),
          ended_at: new Date(state.anchor + POMODORO_MS).toISOString(),
        });
      } else setNow(t);
    };
    check();
    const id = window.setInterval(check, 1000);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [state]);

  const elapsed = Math.min(POMODORO_MS, Math.max(0, elapsedAt(state, now)));

  const start = useCallback(
    (taskId: string | null) => {
      const t = Date.now();
      commit({ status: "running", anchor: t, pausedAt: null, firstStartedAt: t, taskId });
    },
    [commit],
  );
  const pause = () => state.status === "running" && commit({ ...state, status: "paused", pausedAt: Date.now() });
  const resume = () => {
    if (state.status !== "paused") return;
    const t = Date.now();
    commit({ ...state, status: "running", anchor: state.anchor + (t - (state.pausedAt ?? t)), pausedAt: null });
  };
  const reset = () => commit(IDLE);

  /** Ends the current session early; returns it when at least a minute was focused. */
  const stop = (): FinishedSession | null => {
    const t = Date.now();
    const ms = Math.min(POMODORO_MS, elapsedAt(state, t));
    const session =
      (state.status === "running" || state.status === "paused") && ms >= 60_000
        ? {
            task_id: state.taskId,
            duration_minutes: Math.round(ms / 60_000),
            started_at: new Date(state.firstStartedAt).toISOString(),
            ended_at: new Date(t).toISOString(),
          }
        : null;
    commit(IDLE);
    return session;
  };

  return {
    status: state.status,
    taskId: state.taskId,
    elapsedMs: elapsed,
    remainingMs: POMODORO_MS - elapsed,
    progress: elapsed / POMODORO_MS,
    start,
    pause,
    resume,
    reset,
    stop,
  };
};

export type Pomodoro = ReturnType<typeof usePomodoro>;

export const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

import { accessTokenStorageKey } from "@/constants/auth";

const storage = (): Storage | null => {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
};

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

export const getAccessToken = (): string | null => storage()?.getItem(accessTokenStorageKey) ?? null;

export const setAccessToken = (token: string) => {
  storage()?.setItem(accessTokenStorageKey, token);
  notify();
};

export const clearAccessToken = () => {
  storage()?.removeItem(accessTokenStorageKey);
  notify();
};

/** For useSyncExternalStore: re-renders on sign-in/out in this tab and in other tabs. */
export const subscribeAccessToken = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
};

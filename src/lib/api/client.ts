import { ApiError, toApiError } from "./errors";

/** Same-origin by default; next.config.ts rewrites /api/v1 to FastAPI. */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

const REQUEST_TIMEOUT_MS = 30_000;

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Query = Record<string, string | number | boolean | null | undefined | readonly string[]>;

export type RequestOptions = {
  body?: unknown;
  query?: Query;
  signal?: AbortSignal;
  /** Skip the refresh-and-retry on 401 (used by the auth endpoints themselves). */
  skipAuthRefresh?: boolean;
};

const buildUrl = (path: string, query?: Query) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, String(value));
  }
  const qs = params.toString();
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ""}`;
};

const send = async (method: Method, path: string, { body, query, signal }: RequestOptions) => {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  try {
    return await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    if (timeout.aborted) throw new ApiError("The server took too long to respond.", 0, "TIMEOUT");
    throw new ApiError("Unable to reach the server.", 0, "NETWORK");
  }
};

// One refresh at a time, shared by every request that hit 401 together.
let refreshing: Promise<boolean> | null = null;
const refreshSession = () => {
  refreshing ??= send("POST", "/auth/refresh", { skipAuthRefresh: true })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

const goToUnlock = () => {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  if (["/unlock", "/setup", "/recover"].some((p) => pathname.startsWith(p))) return;
  // Full reload on purpose: outside React, and it drops all cached data from the expired session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/unlock?next=${encodeURIComponent(pathname + search)}`);
};

const request = async <T>(method: Method, path: string, options: RequestOptions = {}): Promise<T> => {
  let res = await send(method, path, options);

  if (res.status === 401 && !options.skipAuthRefresh) {
    if (await refreshSession()) res = await send(method, path, options);
    if (res.status === 401) goToUnlock();
  }

  if (res.status === 204) return undefined as T;
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) throw toApiError(res.status, data);
  return data as T;
};

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, "body">) => request<T>("GET", path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PATCH", path, { ...options, body }),
  delete: <T = void>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};

/** Backend `Page[T]`. */
export type Page<T> = { items: T[]; total: number; page: number; size: number; pages: number };

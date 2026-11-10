import { env } from "@/config/env";
import { authRoutes } from "@/constants/auth";
import { clearAccessToken, getAccessToken } from "@/utils/accessToken";
import { ApiError } from "@/utils/ApiError";

const REQUEST_TIMEOUT_MS = 30_000;
const MOCK_DELAY_MS = 300;

type Method = "GET" | "POST" | "PATCH" | "DELETE";

type RequestOptions<T> = {
  /** Returned instead of calling the API while NEXT_PUBLIC_USE_MOCK_API is not "false". */
  mock: () => T;
  body?: unknown;
  signal?: AbortSignal;
};

const buildHeaders = (body: unknown): HeadersInit => {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

/** Reads `message`, or FastAPI-style `detail`. */
const extractErrorMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== "object") return undefined;
  const { message, detail } = data as { message?: unknown; detail?: unknown };
  if (typeof message === "string") return message;
  if (typeof detail === "string") return detail;
  return undefined;
};

const handleUnauthorized = () => {
  clearAccessToken();
  if (window.location.pathname !== authRoutes.login) window.location.assign(authRoutes.login);
};

const request = async <T>(method: Method, path: string, { mock, body, signal }: RequestOptions<T>): Promise<T> => {
  if (env.useMockApi) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return mock();
  }

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
      headers: buildHeaders(body),
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });

    const data: unknown = await response.json().catch(() => null);

    if (response.status === 401) handleUnauthorized();
    if (!response.ok) {
      throw new ApiError(extractErrorMessage(data) ?? `Request failed with status ${response.status}`, response.status, data);
    }

    return data as T;
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    if (timeout.aborted) throw new ApiError("The server took too long to respond.", 0, cause);
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError("Unable to reach the server.", 0, cause);
  }
};

export const api = {
  get: <T>(path: string, options: RequestOptions<T>) => request<T>("GET", path, options),
  post: <T>(path: string, options: RequestOptions<T>) => request<T>("POST", path, options),
  patch: <T>(path: string, options: RequestOptions<T>) => request<T>("PATCH", path, options),
  delete: <T>(path: string, options: RequestOptions<T>) => request<T>("DELETE", path, options),
};

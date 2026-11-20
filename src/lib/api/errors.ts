export type ApiErrorDetail = { field?: string; message: string };

/** Mirrors the backend error envelope: {"error": {"code", "message", "details"}}. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];

  constructor(message: string, status: number, code = "UNKNOWN", details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Status 0 means no HTTP response at all (offline, timeout, API down). */
  get isNetworkError() {
    return this.status === 0;
  }
}

type ErrorEnvelope = { error?: { code?: unknown; message?: unknown; details?: unknown } };

export const toApiError = (status: number, data: unknown): ApiError => {
  const err = (data as ErrorEnvelope | null)?.error;
  const message = typeof err?.message === "string" ? err.message : `Request failed (${status})`;
  const code = typeof err?.code === "string" ? err.code : "UNKNOWN";
  const details = Array.isArray(err?.details)
    ? err.details.filter((d): d is ApiErrorDetail => !!d && typeof (d as ApiErrorDetail).message === "string")
    : [];
  return new ApiError(message, status, code, details);
};

/** A message that is safe to show in a toast. */
export const errorMessage = (error: unknown, fallback = "Something went wrong. Try again.") => {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return "Can't reach Mandy's server. Check that the API is running.";
    return error.message || fallback;
  }
  return fallback;
};

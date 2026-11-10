export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }

  /** Status 0 means the request never got an HTTP response (offline, timeout, CORS). */
  get isNetworkError() {
    return this.status === 0;
  }
}

import { describe, expect, it } from "vitest";
import { ApiError, errorMessage, toApiError } from "@/lib/api/errors";

describe("toApiError", () => {
  it("reads the backend error envelope", () => {
    const err = toApiError(404, { error: { code: "JOB_NOT_FOUND", message: "Job not found", details: [] } });
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.code).toBe("JOB_NOT_FOUND");
    expect(err.message).toBe("Job not found");
  });

  it("keeps only well-formed 422 details", () => {
    const err = toApiError(422, {
      error: { code: "VALIDATION_ERROR", message: "Invalid", details: [{ field: "salary_min", message: "Too low" }, "junk", null] },
    });
    expect(err.details).toEqual([{ field: "salary_min", message: "Too low" }]);
  });

  it("falls back when the body isn't the envelope", () => {
    const err = toApiError(500, "<html>");
    expect(err.code).toBe("UNKNOWN");
    expect(err.message).toBe("Request failed (500)");
  });
});

describe("errorMessage", () => {
  it("explains network errors", () => {
    expect(errorMessage(new ApiError("x", 0))).toMatch(/can't reach/i);
  });
  it("uses the fallback for unknown errors", () => {
    expect(errorMessage(new Error("boom"), "Nope")).toBe("Nope");
  });
});

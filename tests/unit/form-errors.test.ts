import { describe, expect, it, vi } from "vitest";
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { applyApiErrors } from "@/lib/api/form-errors";

describe("applyApiErrors", () => {
  it("maps 422 details onto form fields", () => {
    const setError = vi.fn();
    const err = new ApiError("Invalid", 422, "VALIDATION_ERROR", [{ field: "body.company", message: "Required" }]);
    applyApiErrors(err, setError, ["company", "role"]);
    expect(setError).toHaveBeenCalledWith("company", { type: "server", message: "Required" });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts anything that isn't a field error", () => {
    const setError = vi.fn();
    applyApiErrors(new ApiError("Server down", 500), setError, ["company"]);
    expect(setError).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Server down");
  });
});

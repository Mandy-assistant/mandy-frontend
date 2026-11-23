import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, errorMessage } from "./errors";

/**
 * Puts 422 field errors from FastAPI onto react-hook-form fields.
 * Anything that doesn't map to a field is shown as a toast.
 */
export const applyApiErrors = <T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly string[]) => {
  if (error instanceof ApiError && error.status === 422 && error.details.length) {
    let unmatched = false;
    for (const detail of error.details) {
      const field = detail.field && fields.find((f) => f === detail.field || detail.field?.endsWith(`.${f}`));
      if (field) setError(field as Path<T>, { type: "server", message: detail.message });
      else unmatched = true;
    }
    if (!unmatched) return;
  }
  toast.error(errorMessage(error));
};

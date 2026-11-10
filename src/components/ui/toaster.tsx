"use client";

import { Toast } from "@base-ui/react/toast";
import { AlertCircle, Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

const ToastList = () => {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => {
    const isError = toast.type === "error";

    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        className={cn(
          "relative flex items-start gap-3 overflow-hidden rounded-xl border border-l-4 p-4 shadow-popover transition-all duration-200 select-none data-[ending-style]:translate-x-2 data-[ending-style]:opacity-0 data-[starting-style]:translate-x-4 data-[starting-style]:opacity-0",
          isError ? "border-error/40 border-l-error bg-red-2" : "border-green-2 border-l-green-1 bg-surface",
        )}
      >
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full",
            isError ? "bg-error/10 text-error" : "bg-green-2 text-green-3",
          )}
        >
          {isError ? <AlertCircle className="size-3.5" /> : <Check className="size-3.5" strokeWidth={3} />}
        </span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {toast.title && <Toast.Title className="text-sm font-semibold text-heading" />}
          {toast.description && <Toast.Description className="text-xs leading-relaxed text-body" />}
        </div>

        <Toast.Close
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-icon transition-colors hover:bg-surface-hover hover:text-icon-strong focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
        >
          <X className="size-3.5" />
        </Toast.Close>
      </Toast.Root>
    );
  });
};

export const Toaster = () => (
  <Toast.Portal>
    <Toast.Viewport className="fixed top-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 outline-none sm:w-96">
      <ToastList />
    </Toast.Viewport>
  </Toast.Portal>
);

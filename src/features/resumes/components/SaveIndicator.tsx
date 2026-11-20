"use client";

import { AlertCircle, Check, CloudUpload, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import type { SaveStatus } from "../use-autosave";

export const SaveIndicator = ({ status, onRetry }: { status: SaveStatus; onRetry: () => void }) => (
  <div aria-live="polite" className="flex items-center text-xs font-medium">
    {status === "error" ? (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-destructive-soft px-3 text-destructive transition-colors hover:bg-destructive/15"
      >
        <AlertCircle className="size-3.5" aria-hidden /> Not saved · Retry
      </button>
    ) : (
      <span
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-3 transition-colors",
          status === "saved" || status === "idle" ? "bg-success-soft text-success" : "bg-surface-2 text-muted-foreground",
        )}
      >
        {status === "saving" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : status === "pending" ? (
          <CloudUpload className="size-3.5" aria-hidden />
        ) : (
          <Check className="size-3.5" aria-hidden />
        )}
        {status === "saving" || status === "pending" ? "Saving…" : "Saved"}
      </span>
    )}
  </div>
);

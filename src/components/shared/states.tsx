"use client";

import { AlertTriangle, RotateCcw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/utils/cn";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export const EmptyState = ({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center rounded-lg border-[1.5px] border-dashed border-border text-center",
      compact ? "gap-1.5 p-5" : "gap-3 px-6 py-12",
      className,
    )}
  >
    {Icon && (
      <span className={cn("grid place-items-center rounded-2xl bg-primary-soft text-primary-strong", compact ? "size-9" : "size-12")}>
        <Icon className={compact ? "size-4" : "size-5"} aria-hidden />
      </span>
    )}
    <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>{title}</p>
    {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-1">{action}</div>}
  </div>
);

export const ErrorState = ({
  error,
  onRetry,
  title = "Couldn't load this",
  className,
}: {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
  className?: string;
}) => (
  <div role="alert" className={cn("flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive-soft/50 px-6 py-10 text-center", className)}>
    <span className="grid size-12 place-items-center rounded-2xl bg-destructive-soft text-destructive">
      <AlertTriangle className="size-5" aria-hidden />
    </span>
    <p className="text-base font-semibold">{title}</p>
    <p className="max-w-sm text-sm text-muted-foreground">{errorMessage(error)}</p>
    {onRetry && (
      <Button variant="outline" onClick={onRetry}>
        <RotateCcw data-icon="inline-start" />
        Try again
      </Button>
    )}
  </div>
);

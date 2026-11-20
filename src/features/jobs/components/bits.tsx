import { cn } from "@/utils/cn";
import { companyInitial } from "../format";
import { STATUS_META } from "../status";
import type { JobStatus } from "../types";

const LOGO_TINTS = [
  "bg-primary-soft text-primary-strong",
  "bg-cyan-soft text-cyan",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
  "bg-warning-soft text-warning",
] as const;

const tintFor = (name: string) => {
  let hash = 0;
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return LOGO_TINTS[hash % LOGO_TINTS.length];
};

/** Rounded tile with the company's initial, tinted per company. */
export const CompanyLogo = ({ company, size = "md", className }: { company: string; size?: "sm" | "md" | "lg"; className?: string }) => (
  <span
    aria-hidden
    className={cn(
      "grid shrink-0 place-items-center font-semibold",
      size === "sm" && "size-8 rounded-[9px] text-sm",
      size === "md" && "size-9 rounded-[10px]",
      size === "lg" && "size-12 rounded-[14px] text-lg",
      tintFor(company),
      className,
    )}
  >
    {companyInitial(company)}
  </span>
);

export const StatusDot = ({ status, className }: { status: JobStatus; className?: string }) => (
  <i aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", STATUS_META[status].dot, className)} />
);

export const StatusBadge = ({ status, className }: { status: JobStatus; className?: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
      STATUS_META[status].badge,
      className,
    )}
  >
    <i aria-hidden className="size-1.5 rounded-full bg-current" />
    {STATUS_META[status].label}
  </span>
);

export const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex max-w-full items-center truncate rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
    {children}
  </span>
);

import type { JobStatus } from "./types";

type StatusMeta = {
  label: string;
  /** Solid dot / accent colour. */
  dot: string;
  /** Soft tinted badge. */
  badge: string;
  /** Ring/border tint used when the status is selected. */
  ring: string;
  /** Drop hint shown in an empty column. */
  hint: string;
};

export const STATUS_META: Record<JobStatus, StatusMeta> = {
  saved: {
    label: "Saved",
    dot: "bg-status-saved",
    badge: "bg-surface-2 text-muted-foreground",
    ring: "border-status-saved",
    hint: "Bookmark roles you like here",
  },
  applied: {
    label: "Applied",
    dot: "bg-status-applied",
    badge: "bg-info-soft text-info",
    ring: "border-status-applied",
    hint: "Drop a card here once you apply",
  },
  interview: {
    label: "Interview",
    dot: "bg-status-interview",
    badge: "bg-warning-soft text-warning",
    ring: "border-status-interview",
    hint: "Interviews land here — good luck!",
  },
  offer: {
    label: "Offer",
    dot: "bg-status-offer",
    badge: "bg-success-soft text-success",
    ring: "border-status-offer",
    hint: "Your offers will shine here",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-status-rejected",
    badge: "bg-destructive-soft text-destructive",
    ring: "border-status-rejected",
    hint: "Not every door opens — that's okay",
  },
};

export const statusLabel = (status: JobStatus) => STATUS_META[status].label;

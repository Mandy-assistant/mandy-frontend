import type { MilestoneStatus, RoadmapStatus } from "./types";

/** Token-based accent per roadmap (stable across pages, derived from the id). */
const PALETTE = ["bg-primary", "bg-cyan", "bg-status-interview", "bg-success", "bg-info", "bg-destructive"] as const;

export const roadmapColor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
};

export const ROADMAP_STATUS: Record<RoadmapStatus, { label: string; badge: string }> = {
  active: { label: "Active", badge: "bg-success-soft text-success" },
  paused: { label: "Paused", badge: "bg-warning-soft text-warning" },
  completed: { label: "Completed", badge: "bg-primary-soft text-primary-strong" },
};

export const MILESTONE_STATUS: Record<MilestoneStatus, { label: string; badge: string }> = {
  todo: { label: "To do", badge: "bg-surface-2 text-muted-foreground" },
  in_progress: { label: "In progress", badge: "bg-primary-soft text-primary-strong" },
  done: { label: "Done", badge: "bg-success-soft text-success" },
};

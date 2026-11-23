import { cn } from "@/utils/cn";
import { MILESTONE_STATUS, ROADMAP_STATUS } from "../colors";
import type { MilestoneStatus, RoadmapStatus } from "../types";

const base = "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap";

export const RoadmapStatusBadge = ({ status, className }: { status: RoadmapStatus; className?: string }) => (
  <span className={cn(base, ROADMAP_STATUS[status].badge, className)}>
    <i className="size-1.5 rounded-full bg-current" aria-hidden />
    {ROADMAP_STATUS[status].label}
  </span>
);

export const MilestoneStatusBadge = ({ status, className }: { status: MilestoneStatus; className?: string }) => (
  <span className={cn(base, MILESTONE_STATUS[status].badge, className)}>
    <i className="size-1.5 rounded-full bg-current" aria-hidden />
    {MILESTONE_STATUS[status].label}
  </span>
);

export const SoftBadge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={cn(base, "bg-primary-soft text-primary-strong", className)}>{children}</span>
);

"use client";

import { AlertCircle, CalendarClock, CalendarDays, CheckCircle2, type LucideIcon } from "lucide-react";
import { Overline } from "@/components/shared/PageHeader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roadmapColor } from "@/features/roadmaps";
import { cn } from "@/utils/cn";
import type { TaskPriority } from "../types";
import { PRIORITIES, type Bucket, type ViewFilter } from "../utils";

export const BUCKETS: { value: Bucket; label: string; icon: LucideIcon }[] = [
  { value: "today", label: "Today", icon: CalendarDays },
  { value: "overdue", label: "Overdue", icon: AlertCircle },
  { value: "upcoming", label: "Upcoming", icon: CalendarClock },
  { value: "completed", label: "Completed", icon: CheckCircle2 },
];

export type FilterState = { filter: ViewFilter; priority: TaskPriority | null; roadmap: string | null };
export type RoadmapOption = { id: string; title: string; open: number };

type TaskFiltersProps = FilterState & {
  counts: Record<Bucket, number> | null;
  roadmaps: RoadmapOption[];
  onChange: (patch: Partial<FilterState>) => void;
};

const Count = ({ value, alert }: { value: number | undefined; alert?: boolean }) => (
  <span
    className={cn(
      "ml-auto min-w-6 rounded-full px-1.5 text-center font-mono text-xs tabular-nums",
      alert && value ? "bg-destructive-soft font-semibold text-destructive" : "text-muted-foreground",
    )}
  >
    {value ?? "–"}
  </span>
);

const rowButton =
  "flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-left font-medium transition-colors outline-none hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:bg-primary-soft aria-pressed:text-primary-strong";

/** Desktop: sticky filter card. */
export const TaskFilterCard = ({ filter, priority, roadmap, counts, roadmaps, onChange }: TaskFiltersProps) => (
  <nav aria-label="Task filters" className="sticky top-4 flex flex-col gap-0.5 rounded-xl border bg-card p-3 shadow-card">
    {BUCKETS.map(({ value, label, icon: Icon }) => (
      <button key={value} type="button" aria-pressed={filter === value} onClick={() => onChange({ filter: value })} className={cn(rowButton, "group")}>
        <Icon className="size-4 text-muted-foreground group-aria-pressed:text-primary-strong" aria-hidden />
        {label}
        <Count value={counts?.[value]} alert={value === "overdue"} />
      </button>
    ))}

    {roadmaps.length > 0 && (
      <>
        <Overline className="px-2.5 pt-4 pb-1.5">Roadmaps</Overline>
        {roadmaps.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={roadmap === r.id}
            onClick={() => onChange(roadmap === r.id ? { roadmap: null } : { roadmap: r.id, filter: "all" })}
            className={rowButton}
          >
            <i className={cn("size-2.5 shrink-0 rounded-full", roadmapColor(r.id))} aria-hidden />
            <span className="truncate">{r.title}</span>
            <Count value={r.open} />
          </button>
        ))}
      </>
    )}

    <Overline className="px-2.5 pt-4 pb-2">Priority</Overline>
    <div role="group" aria-label="Priority" className="grid grid-cols-[auto_1fr_1fr_1fr] gap-0.5">
      {[{ value: null, label: "All", dot: "" }, ...PRIORITIES].map((p) => (
        <button
          key={p.label}
          type="button"
          aria-pressed={priority === p.value}
          aria-label={p.value ? `${p.label} priority` : "All priorities"}
          onClick={() => onChange({ priority: p.value })}
          className="flex h-8 cursor-pointer items-center justify-center gap-1 rounded-md px-1.5 border border-transparent text-xs font-medium text-muted-foreground transition-colors outline-none hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary/30 aria-pressed:bg-primary-soft aria-pressed:text-primary-strong"
        >
          {p.dot && <i className={cn("size-2 rounded-full", p.dot)} aria-hidden />}
          {p.value === "medium" ? "Med" : p.label}
        </button>
      ))}
    </div>
  </nav>
);

const ALL = "__all__";

/** Mobile: horizontal chip rail + roadmap/priority selects. */
export const TaskFilterRail = ({ filter, priority, roadmap, counts, roadmaps, onChange }: TaskFiltersProps) => {
  const roadmapItems: Record<string, string> = { [ALL]: "All roadmaps" };
  roadmaps.forEach((r) => (roadmapItems[r.id] = r.title));
  const priorityItems: Record<string, string> = { [ALL]: "Any priority", high: "High", medium: "Medium", low: "Low" };

  return (
    <div className="flex flex-col gap-2">
      <nav aria-label="Task filters" className="-mx-4 flex scrollbar-none gap-2 overflow-x-auto px-4 pb-1">
        {BUCKETS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => onChange({ filter: value })}
            className="flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border bg-surface px-4 font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-strong"
          >
            {label}
            <span className={cn("font-mono text-xs tabular-nums", value === "overdue" && counts?.overdue ? "text-destructive" : "text-muted-foreground")}>
              {counts?.[value] ?? "–"}
            </span>
          </button>
        ))}
      </nav>
      <div className="grid grid-cols-2 gap-2">
        {roadmaps.length > 0 && (
          <Select
            items={roadmapItems}
            value={roadmap ?? ALL}
            onValueChange={(v) => onChange(!v || v === ALL ? { roadmap: null } : { roadmap: v, filter: "all" })}
          >
            <SelectTrigger aria-label="Filter by roadmap" className="h-11 w-full bg-surface">
              {roadmap && <i className={cn("size-2 shrink-0 rounded-full", roadmapColor(roadmap))} aria-hidden />}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roadmapItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select items={priorityItems} value={priority ?? ALL} onValueChange={(v) => onChange({ priority: !v || v === ALL ? null : (v as TaskPriority) })}>
          <SelectTrigger aria-label="Filter by priority" className={cn("h-11 w-full bg-surface", roadmaps.length === 0 && "col-span-2")}>
            {priority && <i className={cn("size-2 shrink-0 rounded-full", PRIORITIES.find((p) => p.value === priority)?.dot)} aria-hidden />}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(priorityItems).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

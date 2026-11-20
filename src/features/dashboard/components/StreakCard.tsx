import { Flame } from "lucide-react";
import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";
import type { DashboardSummary } from "../types";
import { BentoCard } from "./BentoCard";

const LEVELS = [
  "bg-surface-2",
  "bg-[color-mix(in_srgb,var(--primary)_22%,var(--surface-2))]",
  "bg-[color-mix(in_srgb,var(--primary)_45%,var(--surface-2))]",
  "bg-[color-mix(in_srgb,var(--primary)_72%,var(--surface-2))]",
  "bg-primary",
];

const level = (count: number) => Math.min(LEVELS.length - 1, Math.max(0, count));

export const formatMinutes = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
};

const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Streak count plus a 15-week activity heatmap (one column per week). */
export const StreakCard = ({ streak }: { streak: DashboardSummary["streak"] }) => {
  const days = streak.heatmap.slice(-105);
  const active = days.filter((d) => d.count > 0).length;
  return (
    <BentoCard
      title={
        <>
          <Flame
            className={cn(
              "size-5",
              streak.current_days ? "fill-status-interview/30 text-status-interview" : "text-muted-foreground",
            )}
            aria-hidden
          />
          <span>
            <span className="font-mono tabular-nums">{streak.current_days}</span>-day streak
          </span>
        </>
      }
      href="/tasks"
      linkLabel="Tasks"
      labelledBy="brief-streak"
    >
      <p className="-mt-2 text-[13px] text-muted-foreground">
        <span className="font-mono tabular-nums">{formatMinutes(streak.week_minutes)}</span> focused this week · best run:{" "}
        <span className="font-mono tabular-nums">{streak.best_days}</span> {streak.best_days === 1 ? "day" : "days"}
      </p>
      <div
        role="img"
        aria-label={`Activity over the last 15 weeks: active on ${active} of ${days.length} days`}
        className="mt-4 grid max-w-[340px] auto-cols-[minmax(0,1fr)] grid-flow-col grid-rows-7 gap-1"
      >
        {days.map((d, i) => (
          <span
            key={d.date}
            title={`${dayLabel(d.date)}: ${d.count} ${d.count === 1 ? "activity" : "activities"}`}
            style={{ "--tw-animation-delay": `${i * 15}ms` } as CSSProperties}
            className={cn(
              "aspect-square w-full animate-in rounded-[4px] duration-400 fill-mode-both zoom-in-40 fade-in",
              LEVELS[level(d.count)],
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground" aria-hidden>
        Less
        {LEVELS.map((c) => (
          <span key={c} className={cn("size-2.5 rounded-[3px]", c)} />
        ))}
        More
      </div>
    </BentoCard>
  );
};

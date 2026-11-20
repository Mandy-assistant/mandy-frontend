import { format, parseISO } from "date-fns";
import { CalendarDays, Flag } from "lucide-react";
import Link from "next/link";
import { Pressable } from "@/components/motion";
import { roadmapColor } from "../colors";
import type { Roadmap } from "../types";
import { ProgressRing } from "./ProgressRing";
import { RoadmapStatusBadge } from "./StatusBadge";
import { cn } from "@/utils/cn";

export const RoadmapCard = ({ roadmap }: { roadmap: Roadmap }) => (
  <Pressable className="h-full">
    <Link
      href={`/roadmaps/${roadmap.id}`}
      className="group relative flex h-full flex-col gap-4 overflow-hidden rounded-xl border bg-card p-5 shadow-card transition-[border-color,box-shadow] outline-none hover:border-primary/35 hover:shadow-pop focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-brand-gradient opacity-[0.08] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative flex items-start justify-between gap-3">
        <ProgressRing value={roadmap.progress} size={64} stroke={7} label={`${roadmap.title} progress`} />
        <RoadmapStatusBadge status={roadmap.status} />
      </div>
      <div className="relative flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <i className={cn("size-2 shrink-0 rounded-full", roadmapColor(roadmap.id))} aria-hidden />
          <span className="truncate">{roadmap.title}</span>
        </h2>
        {roadmap.goal ? <p className="line-clamp-2 text-sm text-muted-foreground">{roadmap.goal}</p> : <p className="text-sm text-muted-foreground italic">No goal written yet</p>}
      </div>
      <div className="relative flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Flag className="size-3.5" aria-hidden />
          <span className="font-mono text-foreground tabular-nums">
            {roadmap.done_count}/{roadmap.milestone_count}
          </span>
          milestones
        </span>
        {roadmap.target_date && (
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5" aria-hidden />
            Target {format(parseISO(roadmap.target_date), "MMM yyyy")}
          </span>
        )}
      </div>
    </Link>
  </Pressable>
);

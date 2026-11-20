"use client";

import { Check, CalendarCheck } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Fragment } from "react";
import { duration, easeOut, spring } from "@/lib/motion";
import { cn } from "@/utils/cn";
import type { TimelineEntry, TimelineKind } from "../types";
import { BentoCard } from "./BentoCard";

const KIND: Record<TimelineKind, { label: string; bar: string }> = {
  study: { label: "Study", bar: "bg-primary" },
  job: { label: "Job", bar: "bg-status-interview" },
  practice: { label: "Practice", bar: "bg-cyan" },
};

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Today's blocks with a colour bar by kind and a "Now" line placed by the current time. */
export const TodayTimeline = ({ entries, now }: { entries: TimelineEntry[]; now: Date | null }) => {
  const timed = entries.filter((e) => e.time).sort((a, b) => a.time!.localeCompare(b.time!));
  const anytime = entries.filter((e) => !e.time);
  const nowText = now ? hhmm(now) : null;
  // Index in `timed` before which the Now line sits.
  const nowAt = nowText ? timed.findIndex((e) => e.time! > nowText) : -1;
  const nowIndex = nowText ? (nowAt === -1 ? timed.length : nowAt) : -1;
  // The next not-done block after "now" is highlighted.
  const currentIdx = nowIndex >= 0 ? timed.findIndex((e, i) => i >= nowIndex && !e.done) : -1;

  const nowLine = nowText && (
    <motion.li
      key="now"
      layout="position"
      transition={spring}
      className="flex items-center gap-2 py-0.5"
      aria-label={`Now, ${nowText}`}
    >
      <span className="rounded-full bg-primary px-2 py-px font-mono text-[11px] text-primary-foreground tabular-nums">
        {nowText}
      </span>
      <motion.span
        aria-hidden
        className="relative h-0.5 flex-1 origin-left rounded-full bg-primary"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: easeOut, delay: 0.3 }}
      >
        <span className="absolute -top-[3px] left-0 size-2 animate-[pulse-dot_1.6s_ease-in-out_infinite] rounded-full bg-primary" />
      </motion.span>
    </motion.li>
  );

  return (
    <BentoCard
      title="Today"
      href="/tasks"
      linkLabel="Open tasks"
      meta={entries.length ? `${entries.length} block${entries.length === 1 ? "" : "s"}` : undefined}
      labelledBy="brief-today"
      className="xl:absolute xl:inset-0"
    >
      {entries.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed py-8 text-center">
          <CalendarCheck className="size-5 text-primary-strong" aria-hidden />
          <p className="font-medium">Nothing scheduled today</p>
          <Link href="/tasks?new=1" className="text-sm text-primary-strong underline-offset-4 hover:underline">
            Plan a task
          </Link>
        </div>
      ) : (
        <ol className="-mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-2 [mask-image:linear-gradient(to_bottom,black_calc(100%-24px),transparent)] pb-4">
          {timed.map((e, i) => (
            <Fragment key={`${e.time}-${e.title}-${i}`}>
              {i === nowIndex && nowLine}
              <Block entry={e} current={i === currentIdx} index={i} />
            </Fragment>
          ))}
          {nowIndex === timed.length && nowLine}
          {anytime.map((e, i) => (
            <Block key={`any-${e.title}-${i}`} entry={e} index={timed.length + i} />
          ))}
        </ol>
      )}
    </BentoCard>
  );
};

const Block = ({ entry, current, index }: { entry: TimelineEntry; current?: boolean; index: number }) => {
  const kind = KIND[entry.kind] ?? KIND.study;
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: duration.base, ease: easeOut, delay: 0.15 + index * 0.04 }}
      className={cn("flex items-center gap-3 rounded-[14px] px-2.5 py-[9px]", current && "bg-primary-soft")}
    >
      <time className="w-[42px] shrink-0 font-mono text-xs text-muted-foreground tabular-nums">{entry.time ?? "Any"}</time>
      <span aria-hidden className={cn("h-8 w-[3px] shrink-0 rounded-full", kind.bar, entry.done && "opacity-40")} />
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate font-medium", entry.done && "text-muted-foreground line-through")}>
          {entry.title}
        </span>
        <span className="text-xs text-muted-foreground">
          {kind.label}
          {current && <span className="text-primary-strong"> · next up</span>}
        </span>
      </span>
      {entry.done && (
        <>
          <Check className="size-4 shrink-0 text-success" aria-hidden />
          <span className="sr-only">done</span>
        </>
      )}
    </motion.li>
  );
};

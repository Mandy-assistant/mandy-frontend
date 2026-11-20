"use client";

import { format, parseISO } from "date-fns";
import { Briefcase, CalendarClock, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import type { DashboardSummary, JobStatus } from "../types";
import { BentoCard } from "./BentoCard";

const STATUSES: { key: JobStatus; label: string; dot: string }[] = [
  { key: "saved", label: "Saved", dot: "bg-status-saved" },
  { key: "applied", label: "Applied", dot: "bg-status-applied" },
  { key: "interview", label: "Interview", dot: "bg-status-interview" },
  { key: "offer", label: "Offer", dot: "bg-status-offer" },
  { key: "rejected", label: "Rejected", dot: "bg-status-rejected" },
];

/** Pipeline as a stacked bar + legend, and the next interview. */
export const JobPulseCard = ({ summary }: { summary: DashboardSummary }) => {
  const counts = STATUSES.map((s) => ({ ...s, n: summary.pipeline?.[s.key] ?? 0 }));
  const total = counts.reduce((a, c) => a + c.n, 0);
  const iv = summary.next_interview;

  return (
    <BentoCard title="Job pulse" href="/jobs" linkLabel="Open jobs" meta={`${total} total`} labelledBy="brief-jobs">
      {total === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed py-8 text-center">
          <Briefcase className="size-5 text-primary-strong" aria-hidden />
          <p className="font-medium">No applications yet</p>
          <Link href="/jobs?new=1" className="text-sm text-primary-strong underline-offset-4 hover:underline">
            Add your first job
          </Link>
        </div>
      ) : (
        <>
          <div
            role="img"
            aria-label={counts
              .filter((c) => c.n)
              .map((c) => `${c.label} ${c.n}`)
              .join(", ")}
            className="mt-1 mb-3 flex h-3 gap-[3px]"
          >
            {counts
              .filter((c) => c.n)
              .map((c, i) => (
                <motion.span
                  key={c.key}
                  title={`${c.label}: ${c.n}`}
                  style={{ flexGrow: c.n, flexBasis: 0 }}
                  className={cn("h-full origin-left rounded-md", c.dot, c.key === "saved" && "opacity-50")}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1, opacity: c.key === "saved" ? 0.5 : 1 }}
                  transition={{ duration: 0.8, ease: easeOut, delay: 0.25 + i * 0.08 }}
                />
              ))}
          </div>
          <ul className="mb-3.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-xs text-muted-foreground">
            {counts.map((c) => (
              <li key={c.key} className="inline-flex items-center gap-1.5">
                <span aria-hidden className={cn("size-2 rounded-full", c.dot)} />
                {c.label} <span className="font-mono text-foreground tabular-nums">{c.n}</span>
              </li>
            ))}
          </ul>
          <dl className="mb-3.5 grid grid-cols-2 gap-2">
            <Stat value={summary.active_applications} label="active" />
            <Stat
              value={summary.interviews_this_week}
              label={summary.interviews_this_week === 1 ? "interview this week" : "interviews this week"}
            />
          </dl>
        </>
      )}

      {iv ? (
        <Link
          href="/jobs"
          className="mt-auto flex items-center gap-2.5 rounded-[14px] bg-warning-soft px-3 py-2.5 transition-colors hover:bg-warning-soft/70"
        >
          <CalendarClock className="size-5 shrink-0 text-warning" aria-hidden />
          <span className="min-w-0 flex-1">
            <b className="block truncate font-medium">Interview · {iv.company}</b>
            <span className="block truncate text-xs text-muted-foreground">
              {iv.interview_at ? format(parseISO(iv.interview_at), "EEE d MMM, HH:mm") : "Date to be confirmed"} · {iv.role}
            </span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-warning" aria-hidden />
        </Link>
      ) : (
        total > 0 && (
          <p className="mt-auto rounded-[14px] bg-surface-2 px-3 py-2.5 text-xs text-muted-foreground">
            No interviews booked yet. Keep going.
          </p>
        )
      )}
    </BentoCard>
  );
};

const Stat = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col-reverse rounded-[14px] bg-surface-2 px-3 py-2">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="font-mono text-xl font-semibold tabular-nums">{value}</dd>
  </div>
);

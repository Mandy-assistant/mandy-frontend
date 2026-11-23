"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { memo, type KeyboardEvent } from "react";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime, formatSalary } from "../format";
import { STATUS_META } from "../status";
import type { Job, JobStatus } from "../types";
import { CompanyLogo, StatusBadge, Tag } from "./bits";
import { StatusSelect } from "./StatusSelect";

type JobCardBodyProps = {
  job: Job;
  /** Mobile: show a status select instead of the badge. */
  showStatusSelect?: boolean;
  onStatusChange?: (status: JobStatus) => void;
};

const MAX_TAGS = 3;

export const JobCardBody = ({ job, showStatusSelect, onStatusChange }: JobCardBodyProps) => {
  const salary = formatSalary(job);
  const interview = job.status === "interview" && formatDateTime(job.interview_at);
  const applied = formatDate(job.applied_at, "MMM d");
  const extraTags = job.tags.length - MAX_TAGS;

  return (
    <>
      <div className="flex items-center gap-2.5">
        <CompanyLogo company={job.company} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{job.role}</p>
          <p className="truncate text-[13px] text-muted-foreground">{job.company}</p>
        </div>
      </div>

      <div className="my-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {job.location && (
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{job.location}</span>
          </span>
        )}
        {interview ? (
          <span className="inline-flex items-center gap-1 font-medium text-warning">
            <Clock className="size-3" aria-hidden />
            {interview}
          </span>
        ) : applied ? (
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3" aria-hidden />
            Applied {applied}
          </span>
        ) : null}
      </div>

      {job.tags.length > 0 && (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {job.tags.slice(0, MAX_TAGS).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {extraTags > 0 && <Tag>+{extraTags}</Tag>}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
        {showStatusSelect && onStatusChange ? (
          // Keep taps on the select from opening the card or starting a drag.
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            <StatusSelect
              value={job.status}
              onChange={onStatusChange}
              label={`Status of ${job.role} at ${job.company}`}
              className="h-11 min-w-36"
            />
          </div>
        ) : (
          <StatusBadge status={job.status} />
        )}
        {salary && <span className="font-mono text-foreground tabular-nums">{salary}</span>}
      </div>
    </>
  );
};

export const cardClass =
  "w-full rounded-lg border bg-card p-3.5 text-left shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

type SortableJobCardProps = {
  job: Job;
  index: number;
  mobile: boolean;
  onOpen: (job: Job) => void;
  onStatusChange: (job: Job, status: JobStatus) => void;
};

export const SortableJobCard = memo(function SortableJobCard({ job, index, mobile, onOpen, onStatusChange }: SortableJobCardProps) {
  const reduced = useReducedMotion();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { type: "job", status: job.status },
  });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !isDragging) {
      e.preventDefault();
      onOpen(job);
      return;
    }
    listeners?.onKeyDown?.(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-manipulation", isDragging && "z-10")}
    >
      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: duration.slow, ease: easeOut, delay: Math.min(index, 8) * 0.04 }}
      >
        <div
          {...attributes}
          {...listeners}
          onKeyDown={onKeyDown}
          onClick={() => onOpen(job)}
          aria-roledescription="draggable job card"
          aria-label={`${job.role} at ${job.company}, ${STATUS_META[job.status].label}. Press Enter to open, Space to move.`}
          className={cn(
            cardClass,
            "cursor-grab transition-[translate,box-shadow,opacity] duration-200 ease-out-expo active:cursor-grabbing",
            !reduced && "hover:-translate-y-0.5 hover:shadow-pop",
            isDragging && "border-dashed border-primary/50 bg-primary-soft/40 opacity-40 shadow-none",
          )}
        >
          <JobCardBody job={job} showStatusSelect={mobile} onStatusChange={(s) => onStatusChange(job, s)} />
        </div>
      </motion.div>
    </div>
  );
});

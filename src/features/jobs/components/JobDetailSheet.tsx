"use client";

import { Banknote, CalendarCheck, Clock, ExternalLink, Pencil, Trash2, UserRound } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Overline } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { errorMessage } from "@/lib/api/errors";
import { spring } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime, formatSalary, prettyUrl } from "../format";
import { useDeleteJob, useJob, useJobTimeline, useMoveJob } from "../hooks";
import { STATUS_META } from "../status";
import { JOB_STATUSES, type Job } from "../types";
import { CompanyLogo, StatusDot, Tag } from "./bits";

type JobDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Latest copy from a list; the sheet refreshes it from GET /jobs/{id}. */
  job: Job | null;
  mobile: boolean;
  onEdit: (job: Job) => void;
};

export const JobDetailSheet = ({ open, onOpenChange, job: initial, mobile, onEdit }: JobDetailSheetProps) => {
  const { data } = useJob(open ? (initial?.id ?? null) : null, initial ?? undefined);
  const job = data ?? initial;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={mobile ? "bottom" : "right"}
        className={cn(
          "gap-0 overflow-hidden border bg-card p-0 shadow-pop",
          mobile
            ? "max-h-[88dvh] rounded-t-2xl"
            : "inset-y-3! right-3! h-auto! w-[calc(100%-1.5rem)] rounded-xl sm:max-w-[420px]!",
        )}
      >
        {job && <DetailBody job={job} open={open} onEdit={onEdit} onDeleted={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
};

const DetailBody = ({ job, open, onEdit, onDeleted }: { job: Job; open: boolean; onEdit: (job: Job) => void; onDeleted: () => void }) => {
  const reduced = useReducedMotion();
  const { move } = useMoveJob();
  const remove = useDeleteJob();
  const [confirm, setConfirm] = useState(false);
  const salary = formatSalary(job);

  return (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-4">
        <div className="flex items-start gap-3 pr-8">
          <CompanyLogo company={job.company} size="lg" />
          <div className="min-w-0">
            <SheetTitle className="text-xl leading-tight font-bold">{job.role}</SheetTitle>
            <SheetDescription className="mt-1">
              {job.company}
              {job.location && ` · ${job.location}`}
            </SheetDescription>
          </div>
        </div>

        <Overline className="mt-6">Status</Overline>
        <div role="group" aria-label="Move to status" className="mt-2.5 grid grid-cols-2 gap-2">
          {JOB_STATUSES.map((s) => {
            const active = job.status === s;
            return (
              <button
                key={s}
                type="button"
                aria-pressed={active}
                onClick={() => !active && move(job, s, 0)}
                className={cn(
                  "relative flex min-h-11 items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm font-medium outline-none transition-colors hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ring/50",
                  active && "border-primary text-primary-strong hover:bg-transparent",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`job-status-${job.id}`}
                    transition={reduced ? { duration: 0 } : spring}
                    className="absolute inset-0 rounded-[inherit] bg-primary-soft"
                    aria-hidden
                  />
                )}
                <StatusDot status={s} className="relative" />
                <span className="relative">{STATUS_META[s].label}</span>
              </button>
            );
          })}
        </div>

        <Overline className="mt-6">Details</Overline>
        <dl className="mt-2.5 flex flex-col divide-y rounded-lg border bg-surface-2/40">
          <DetailRow icon={Banknote} label="Salary">
            {salary ? <span className="font-mono tabular-nums">{salary}</span> : <Muted>Not set</Muted>}
          </DetailRow>
          <DetailRow icon={CalendarCheck} label="Applied">
            {formatDate(job.applied_at) ?? <Muted>Not yet</Muted>}
          </DetailRow>
          <DetailRow icon={Clock} label="Interview">
            {job.interview_at ? <span className="font-medium text-warning">{formatDateTime(job.interview_at)}</span> : <Muted>Not scheduled</Muted>}
          </DetailRow>
          <DetailRow icon={UserRound} label="Contact">
            {job.contact ? <span className="break-words">{job.contact}</span> : <Muted>—</Muted>}
          </DetailRow>
          <DetailRow icon={ExternalLink} label="Link">
            {job.url ? (
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block truncate font-medium text-primary-strong underline-offset-4 hover:underline"
              >
                {prettyUrl(job.url)}
              </a>
            ) : (
              <Muted>—</Muted>
            )}
          </DetailRow>
        </dl>

        {job.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
        )}

        <Overline className="mt-6">Notes</Overline>
        {job.notes ? (
          <p className="mt-2.5 rounded-lg bg-surface-2 p-3.5 text-sm leading-relaxed whitespace-pre-wrap">{job.notes}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No notes yet — add prep ideas or questions with Edit.</p>
        )}

        <Overline className="mt-6">Timeline</Overline>
        <Timeline jobId={job.id} enabled={open} />
      </div>

      <div className="flex shrink-0 gap-2 border-t bg-muted/40 px-6 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] md:pb-3.5">
        <Button variant="outline" className="flex-1 max-md:h-11" onClick={() => onEdit(job)}>
          <Pencil data-icon="inline-start" aria-hidden />
          Edit
        </Button>
        <Button variant="destructive" className="max-md:h-11" onClick={() => setConfirm(true)}>
          <Trash2 data-icon="inline-start" aria-hidden />
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete ${job.role} at ${job.company}?`}
        description="This removes the job and its status history. It can't be undone."
        onConfirm={() => remove.mutateAsync(job).then(onDeleted, () => undefined)}
      />
    </>
  );
};

const Muted = ({ children }: { children: ReactNode }) => <span className="text-muted-foreground">{children}</span>;

const DetailRow = ({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) => (
  <div className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
    <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
    <dd className="min-w-0 flex-1 text-right">{children}</dd>
  </div>
);

const Timeline = ({ jobId, enabled }: { jobId: string; enabled: boolean }) => {
  // Disabled while the sheet animates closed (e.g. right after a delete).
  const { data, isPending, isError, error, refetch } = useJobTimeline(enabled ? jobId : null);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading timeline" className="mt-3 flex flex-col gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="shimmer size-3 rounded-full" />
            <div className="shimmer h-3.5 flex-1 rounded-md" />
          </div>
        ))}
      </div>
    );
  }
  if (isError) {
    return (
      <div role="alert" className="mt-2.5 flex items-center justify-between gap-3 rounded-lg bg-destructive-soft/60 px-3.5 py-2.5 text-sm">
        <span className="text-muted-foreground">{errorMessage(error)}</span>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }
  const events = [...data].sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  if (!events.length) return <p className="mt-2 text-sm text-muted-foreground">No status changes yet.</p>;

  return (
    <ol className="mt-3 flex flex-col" aria-live="polite">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < events.length - 1 && <span aria-hidden className="absolute top-4 bottom-0 left-[5px] w-px bg-border" />}
          <span aria-hidden className={cn("relative mt-1 size-[11px] shrink-0 rounded-full ring-4 ring-card", STATUS_META[e.to_status].dot)} />
          <div className="min-w-0 text-sm">
            <p className="font-medium">
              {e.from_status ? (
                <>
                  {STATUS_META[e.from_status].label} <span className="text-muted-foreground">→</span> {STATUS_META[e.to_status].label}
                </>
              ) : (
                <>Added to {STATUS_META[e.to_status].label}</>
              )}
            </p>
            <p className="font-mono text-xs text-muted-foreground tabular-nums">{formatDateTime(e.changed_at)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
};

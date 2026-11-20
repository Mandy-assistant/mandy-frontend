"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { Check, ChevronRight, Loader2, Pause, Play, Plus, RotateCcw, SkipForward } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { useCompleteTask, useLogFocusSession } from "../hooks";
import { formatClock, POMODORO_MS, type Pomodoro } from "../pomodoro";
import type { DashboardSummary, Task } from "../types";

const R = 70;
const C = 2 * Math.PI * R;

const PRIORITY: Record<Task["priority"], string> = { high: "High priority", medium: "Medium priority", low: "Low priority" };

const subtitle = (t: Task, now: Date | null) => {
  if (t.description) return t.description;
  const bits = [PRIORITY[t.priority]];
  if (t.due_date && now) {
    const days = differenceInCalendarDays(parseISO(t.due_date), now);
    bits.push(days < 0 ? `overdue by ${-days} day${days === -1 ? "" : "s"}` : days === 0 ? "due today" : `due in ${days} days`);
  }
  return bits.join(" · ");
};

type Props = { summary: DashboardSummary; pomodoro: Pomodoro; now: Date | null };

/** Dark "Focus now" card: current task, 25-minute pomodoro ring, Mark done / Skip, and Up next. */
export const FocusCard = ({ summary, pomodoro, now }: Props) => {
  const complete = useCompleteTask();
  const logSession = useLogFocusSession();
  const queue = [summary.focus_task, summary.up_next].filter((t): t is Task => !!t);
  const [skip, setSkip] = useState(0);
  const current = queue.length ? queue[skip % queue.length] : null;
  const next = queue.length > 1 ? queue[(skip + 1) % queue.length] : null;

  const rm = summary.current_roadmap;
  const context = current?.roadmap_title
    ? [current.roadmap_title, current.milestone_title].filter(Boolean).join(" · ")
    : rm
      ? `${rm.title} · Milestone ${rm.milestone_index} of ${rm.milestone_count}`
      : "Tasks";

  const { status } = pomodoro;
  const running = status === "running";

  const markDone = () => {
    if (!current) return;
    complete.mutate(current.id, {
      onSuccess: () => {
        const session = pomodoro.stop();
        if (session) logSession.mutate({ ...session, task_id: current.id });
        setSkip(0);
        toast.success(`“${current.title}” is done.`, {
          description: next ? `Up next: ${next.title}` : "That's everything due for now.",
        });
      },
    });
  };

  const primary =
    status === "running" ? (
      <Pill solid onClick={pomodoro.pause} icon={<Pause />}>
        Pause
      </Pill>
    ) : status === "paused" ? (
      <Pill solid onClick={pomodoro.resume} icon={<Play />}>
        Resume
      </Pill>
    ) : (
      <Pill solid onClick={() => pomodoro.start(current?.id ?? null)} icon={<Play />}>
        {status === "finished" ? "Start another" : "Start focus"}
      </Pill>
    );

  return (
    <article
      aria-label="Focus now"
      className="relative isolate flex h-full flex-col gap-[18px] overflow-hidden rounded-2xl bg-focus px-5 py-6 text-focus-foreground shadow-pop sm:px-7 sm:py-[26px]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[170px] -right-[60px] -z-10 size-[340px] rounded-full bg-primary opacity-50 blur-[70px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-[120px] -bottom-[150px] -z-10 size-[240px] rounded-full bg-cyan opacity-30 blur-[70px]"
      />

      <div className="flex flex-wrap items-center gap-2.5 text-xs text-focus-muted">
        <span className="inline-flex items-center gap-[7px] rounded-full bg-primary/30 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em]">
          <span
            className={cn("size-1.5 rounded-full bg-cyan", running && "animate-[pulse-dot_1.6s_ease-in-out_infinite]")}
            aria-hidden
          />
          FOCUS NOW
        </span>
        <span className="min-w-0 truncate">{context}</span>
        <Link
          href="/tasks"
          className="ml-auto inline-flex min-h-9 items-center gap-0.5 rounded-full px-2 font-medium hover:bg-white/10 hover:text-focus-foreground"
        >
          Tasks <ChevronRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      <div className="flex flex-1 flex-col-reverse items-start gap-6 sm:flex-row sm:items-center sm:gap-7">
        <div className="w-full min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current?.id ?? "none"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: duration.base, ease: easeOut }}
            >
              <h2 className="text-[clamp(24px,3.2vw,34px)] leading-[1.15] font-extrabold tracking-[-0.03em] break-words">
                {current ? current.title : "You're all caught up"}
              </h2>
              <p className="mt-1.5 line-clamp-2 font-medium text-focus-muted">
                {current
                  ? subtitle(current, now)
                  : "Nothing overdue or due today. Run a free focus session, or plan your next task."}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-[18px] flex flex-wrap gap-2.5">
            {primary}
            {current ? (
              <Pill
                onClick={markDone}
                disabled={complete.isPending}
                icon={complete.isPending ? <Loader2 className="animate-spin" /> : <Check />}
              >
                Mark done
              </Pill>
            ) : (
              <Link href="/tasks?new=1" className={pillClass(false)}>
                <Plus className="size-4" aria-hidden />
                Add a task
              </Link>
            )}
            {status !== "idle" && (
              <Pill onClick={() => pomodoro.start(current?.id ?? null)} icon={<RotateCcw />}>
                Restart
              </Pill>
            )}
            {next && (
              <Pill onClick={() => setSkip((s) => s + 1)} icon={<SkipForward />}>
                Skip
              </Pill>
            )}
          </div>
        </div>

        <Ring pomodoro={pomodoro} />
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-white/6 px-3.5 py-3">
        <span className="text-[11px] font-semibold tracking-[0.08em] text-focus-muted uppercase">Up next</span>
        {next ? (
          <span className="max-w-full min-w-0 truncate">
            {next.title}
            <span className="text-focus-muted"> · {PRIORITY[next.priority].replace(" priority", "").toLowerCase()} priority</span>
          </span>
        ) : (
          <Link href="/tasks" className="text-focus-muted underline-offset-4 hover:text-focus-foreground hover:underline">
            Nothing queued. Open your tasks
          </Link>
        )}
      </div>
    </article>
  );
};

const pillClass = (solid: boolean) =>
  cn(
    "inline-flex h-11 items-center gap-2 rounded-full px-4 font-medium transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-60 motion-reduce:active:scale-100 sm:h-10 [&_svg]:size-4",
    solid ? "bg-white text-focus hover:bg-white/90" : "bg-white/10 text-focus-foreground hover:bg-white/18",
  );

const Pill = ({
  solid = false,
  icon,
  children,
  ...props
}: { solid?: boolean; icon: ReactNode; children: ReactNode } & React.ComponentProps<"button">) => (
  <button type="button" className={pillClass(solid)} {...props}>
    <span aria-hidden className="contents">
      {icon}
    </span>
    {children}
  </button>
);

const Ring = ({ pomodoro }: { pomodoro: Pomodoro }) => {
  const { status, remainingMs, progress } = pomodoro;
  const label =
    status === "paused" ? "paused" : status === "finished" ? "done, take a break" : `of ${formatClock(POMODORO_MS)} focus`;
  return (
    <div
      role="timer"
      aria-label={`Focus timer: ${formatClock(remainingMs)} left, ${status}`}
      className="relative size-[132px] shrink-0 self-center sm:size-[156px]"
    >
      <svg viewBox="0 0 156 156" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="focus-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--cyan)" }} />
          </linearGradient>
        </defs>
        <circle cx="78" cy="78" r={R} fill="none" strokeWidth="10" className="stroke-white/10" />
        <circle
          cx="78"
          cy="78"
          r={R}
          fill="none"
          strokeWidth="10"
          stroke="url(#focus-ring)"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * progress}
          className={cn("transition-[stroke-dashoffset] ease-linear", status === "running" ? "duration-1000" : "duration-300")}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <b
          className={cn(
            "font-mono text-[28px] font-bold tracking-[-0.02em] tabular-nums sm:text-[32px]",
            status === "paused" && "opacity-70",
          )}
        >
          {formatClock(remainingMs)}
        </b>
        <span className="text-xs text-focus-muted">{label}</span>
      </div>
    </div>
  );
};

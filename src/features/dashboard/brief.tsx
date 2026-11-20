import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Fragment, type ReactNode } from "react";
import type { DashboardSummary } from "./types";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const B = ({ children }: { children: ReactNode }) => <b className="font-semibold text-foreground">{children}</b>;
const Em = ({ children }: { children: ReactNode }) => (
  <em className="font-semibold text-primary-strong not-italic">{children}</em>
);

/** "a, b and c" with React nodes. */
const joinList = (items: ReactNode[]) =>
  items.map((item, i) => (
    <Fragment key={i}>
      {i > 0 && (i === items.length - 1 ? " and " : ", ")}
      {item}
    </Fragment>
  ));

/** "today at 11:00", "tomorrow at 11:00", "on Friday", "on 3 Dec". */
export const whenLabel = (iso: string, now: Date) => {
  const d = parseISO(iso);
  const days = differenceInCalendarDays(d, now);
  if (days === 0) return `today at ${format(d, "HH:mm")}`;
  if (days === 1) return `tomorrow at ${format(d, "HH:mm")}`;
  if (days > 1 && days < 7) return `on ${format(d, "EEEE")}`;
  return `on ${format(d, "d MMM")}`;
};

/** The one-paragraph brief, written from the summary. Call on the client (uses the clock). */
export const buildBrief = (s: DashboardSummary, now: Date): ReactNode => {
  const have: ReactNode[] = [];

  const due = s.tasks_due_today_count;
  if (due && s.overdue_count)
    have.push(
      <>
        <B>{plural(due, "task")}</B> due today (plus <B>{s.overdue_count} overdue</B>)
      </>,
    );
  else if (due)
    have.push(
      <>
        <B>{plural(due, "task")}</B> due today
      </>,
    );
  else if (s.overdue_count) have.push(<B>{plural(s.overdue_count, "overdue task")}</B>);

  if (s.next_interview)
    have.push(
      <>
        an <B>interview with {s.next_interview.company}</B>{" "}
        {s.next_interview.interview_at ? whenLabel(s.next_interview.interview_at, now) : "coming up"}
      </>,
    );
  else if (s.active_applications)
    have.push(
      <>
        <B>{plural(s.active_applications, "application")}</B> in flight
      </>,
    );

  const sentences: ReactNode[] = [];
  sentences.push(have.length ? <>You have {joinList(have)}.</> : <>Nothing is due today — your calendar is wide open.</>);

  const rm = s.current_roadmap;
  if (rm)
    sentences.push(
      rm.progress >= 100 ? (
        <>
          You&apos;ve finished <B>{rm.title}</B>. Time to pick the next goal.
        </>
      ) : (
        <>
          You&apos;re <B>{Math.round(rm.progress)}%</B> through <B>{rm.title}</B>.
        </>
      ),
    );

  if (s.completed_today)
    sentences.push(
      <>
        Already <B>{plural(s.completed_today, "task")}</B> done today — nice.
      </>,
    );

  if (s.focus_task)
    sentences.push(
      <>
        Let&apos;s start with <Em>{s.focus_task.title}</Em>.
      </>,
    );
  else if (rm?.next_milestone)
    sentences.push(
      <>
        Next milestone: <Em>{rm.next_milestone.title}</Em>.
      </>,
    );

  return joinSentences(sentences);
};

const joinSentences = (sentences: ReactNode[]) =>
  sentences.map((s, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      {s}
    </Fragment>
  ));

import { differenceInCalendarDays, format, isSameYear, parseISO } from "date-fns";
import { useHydrated } from "@/lib/use-hydrated";
import type { Task, TaskFilter, TaskPriority } from "./types";

/** `?filter=` values: the API filters plus "all" (open tasks of every bucket). */
export type ViewFilter = TaskFilter | "all";
export type Bucket = "overdue" | "today" | "upcoming" | "completed";

export const PRIORITIES: { value: TaskPriority; label: string; dot: string }[] = [
  { value: "high", label: "High", dot: "bg-priority-high" },
  { value: "medium", label: "Medium", dot: "bg-priority-medium" },
  { value: "low", label: "Low", dot: "bg-priority-low" },
];
export const priorityDot = (p: TaskPriority) => PRIORITIES.find((x) => x.value === p)?.dot ?? "bg-muted-foreground";
const PRIORITY_RANK: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };

/** Local calendar date as YYYY-MM-DD. Call only after hydration or in handlers. */
export const localISODate = (date = new Date()) => format(date, "yyyy-MM-dd");

/** Today's local date, or null during SSR/hydration (dates must not be computed while prerendering). */
export const useToday = () => {
  const hydrated = useHydrated();
  return hydrated ? localISODate() : null;
};

export const bucketOf = (task: Task, today: string): Bucket => {
  if (task.status === "done") return "completed";
  if (!task.due_date) return "upcoming";
  if (task.due_date < today) return "overdue";
  if (task.due_date === today) return "today";
  return "upcoming";
};

export const isOverdue = (task: Task, today: string | null) =>
  !!today && task.status !== "done" && !!task.due_date && task.due_date < today;

/** Stable order so a restored task lands back where it was: due date, priority, then creation. */
export const compareTasks = (a: Task, b: Task) => {
  if (a.status === "done" && b.status === "done") return (b.completed_at ?? "").localeCompare(a.completed_at ?? "");
  if (a.status !== b.status) return a.status === "done" ? 1 : -1;
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  }
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || a.created_at.localeCompare(b.created_at);
};

export const dueLabel = (dueDate: string, today: string) => {
  const date = parseISO(dueDate);
  const diff = differenceInCalendarDays(date, parseISO(today));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return format(date, "EEE");
  return format(date, isSameYear(date, parseISO(today)) ? "MMM d" : "MMM d, yyyy");
};

export type TaskGroup = { key: string; label: string; tasks: Task[] };

const groupBy = (tasks: Task[], keyOf: (t: Task) => [string, string]) => {
  const groups: TaskGroup[] = [];
  for (const task of tasks) {
    const [key, label] = keyOf(task);
    const group = groups.find((g) => g.key === key);
    if (group) group.tasks.push(task);
    else groups.push({ key, label, tasks: [task] });
  }
  return groups;
};

const BUCKET_LABEL: Record<Bucket, string> = { overdue: "Overdue", today: "Today", upcoming: "Upcoming", completed: "Completed" };

/** Splits an already-filtered, sorted list into headed groups for the current view. */
export const groupTasks = (tasks: Task[], filter: ViewFilter, today: string): TaskGroup[] => {
  switch (filter) {
    case "today":
    case "overdue":
      return [{ key: filter, label: BUCKET_LABEL[filter], tasks }];
    case "upcoming":
      return groupBy(tasks, (t) => {
        if (!t.due_date) return ["none", "No due date"];
        const date = parseISO(t.due_date);
        const diff = differenceInCalendarDays(date, parseISO(today));
        return [t.due_date, diff === 1 ? "Tomorrow" : format(date, diff < 7 ? "EEEE" : "EEE, MMM d")];
      });
    case "completed":
      return groupBy(tasks, (t) => {
        const day = t.completed_at ? localISODate(parseISO(t.completed_at)) : "";
        const diff = day ? differenceInCalendarDays(parseISO(today), parseISO(day)) : 99;
        if (diff <= 0) return ["today", "Completed today"];
        if (diff === 1) return ["yesterday", "Yesterday"];
        if (diff < 7) return ["week", "Earlier this week"];
        return ["earlier", "Earlier"];
      });
    default:
      return groupBy(tasks, (t) => {
        const bucket = bucketOf(t, today);
        if (bucket === "upcoming" && !t.due_date) return ["none", "No due date"];
        return [bucket, BUCKET_LABEL[bucket]];
      });
  }
};

export const matchesView = (task: Task, filter: ViewFilter, today: string) => {
  const bucket = bucketOf(task, today);
  return filter === "all" ? bucket !== "completed" : bucket === filter;
};

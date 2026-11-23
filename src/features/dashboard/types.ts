import type { NewsItem } from "@/features/news/types";

// Minimal shapes from the API contract that the brief needs. The full types live in each
// feature folder; these are kept local so the brief doesn't depend on them.

export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: "todo" | "done";
  roadmap_id: string | null;
  milestone_id: string | null;
  roadmap_title: string | null;
  milestone_title: string | null;
};

export type JobStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export type Job = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  status: JobStatus;
  interview_at: string | null;
};

export type Milestone = {
  id: string;
  roadmap_id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  target_date: string | null;
};

export type { NewsItem };

export type TimelineKind = "study" | "job" | "practice";
export type TimelineEntry = { time: string | null; title: string; kind: TimelineKind; done: boolean };

export type DashboardSummary = {
  owner_name: string;
  active_applications: number;
  interviews_this_week: number;
  next_interview: Job | null;
  pipeline: Record<JobStatus, number>;
  tasks_due_today: Task[];
  tasks_due_today_count: number;
  overdue_count: number;
  completed_today: number;
  focus_task: Task | null;
  up_next: Task | null;
  current_roadmap: {
    id: string;
    title: string;
    progress: number;
    milestone_index: number;
    milestone_count: number;
    next_milestone: Milestone | null;
  } | null;
  latest_news: NewsItem[];
  streak: {
    current_days: number;
    best_days: number;
    week_minutes: number;
    heatmap: { date: string; count: number }[];
  };
  timeline: TimelineEntry[];
};

export type FocusSessionCreate = { task_id?: string | null; duration_minutes: number; started_at: string; ended_at: string };
export type FocusSession = FocusSessionCreate & { id: string };

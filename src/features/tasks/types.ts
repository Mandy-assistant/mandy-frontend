/** API types for /tasks (snake_case, per docs/api-contract.md). */
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "done";
export type TaskFilter = "today" | "upcoming" | "overdue" | "completed";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  /** YYYY-MM-DD */
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  completed_at: string | null;
  roadmap_id: string | null;
  milestone_id: string | null;
  roadmap_title: string | null;
  milestone_title: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskCreate = {
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: TaskPriority;
  roadmap_id?: string | null;
  milestone_id?: string | null;
};

export type TaskUpdate = Partial<TaskCreate>;

export type TaskListParams = {
  filter?: TaskFilter;
  priority?: TaskPriority;
  roadmap_id?: string;
  milestone_id?: string;
  tz?: string;
};

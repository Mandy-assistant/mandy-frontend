import type { Task } from "@/types/task";

export const mockTasks = (): Task[] => [
  { id: "1", title: "Review today's brief", done: false, dueAt: new Date().toISOString() },
  { id: "2", title: "Update resume summary", done: false, dueAt: null },
  { id: "3", title: "Apply to two saved jobs", done: true, dueAt: null },
];

import { api } from "@/lib/api/client";
import type { DashboardSummary, FocusSession, FocusSessionCreate, Task } from "./types";

export const dashboardApi = {
  summary: (tz: string, signal?: AbortSignal) => api.get<DashboardSummary>("/dashboard/summary", { query: { tz }, signal }),
  completeTask: (id: string) => api.post<Task>(`/tasks/${id}/complete`),
  logFocusSession: (body: FocusSessionCreate) => api.post<FocusSession>("/focus/sessions", body),
};

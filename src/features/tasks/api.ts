import { api } from "@/lib/api/client";
import type { Task, TaskCreate, TaskListParams, TaskUpdate } from "./types";

export const tasksApi = {
  list: (params: TaskListParams, signal?: AbortSignal) => api.get<Task[]>("/tasks", { query: params, signal }),
  create: (body: TaskCreate) => api.post<Task>("/tasks", body),
  update: (id: string, body: TaskUpdate) => api.patch<Task>(`/tasks/${id}`, body),
  remove: (id: string) => api.delete(`/tasks/${id}`),
  complete: (id: string) => api.post<Task>(`/tasks/${id}/complete`),
  reopen: (id: string) => api.post<Task>(`/tasks/${id}/reopen`),
};

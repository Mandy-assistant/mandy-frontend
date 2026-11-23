import { api, type Page } from "@/lib/api/client";
import type { Job, JobInput, JobListParams, JobStatusChange, JobTimelineEvent } from "./types";

export const jobsApi = {
  list: (params: JobListParams, signal?: AbortSignal) => api.get<Page<Job>>("/jobs", { query: params, signal }),
  get: (id: string, signal?: AbortSignal) => api.get<Job>(`/jobs/${id}`, { signal }),
  create: (body: JobInput) => api.post<Job>("/jobs", body),
  update: (id: string, body: Partial<JobInput>) => api.patch<Job>(`/jobs/${id}`, body),
  remove: (id: string) => api.delete(`/jobs/${id}`),
  setStatus: (id: string, body: JobStatusChange) => api.patch<Job>(`/jobs/${id}/status`, body),
  timeline: (id: string, signal?: AbortSignal) => api.get<JobTimelineEvent[]>(`/jobs/${id}/timeline`, { signal }),
};

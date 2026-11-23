import { api, type Page } from "@/lib/api/client";
import type { Job } from "@/features/jobs/types";
import type { Posting } from "./types";

export type DiscoverPage = Page<Posting> & { personalizing: boolean };

type Query = { page: number; size: number; region?: string; q?: string };

export const discoverApi = {
  list: (query: Query, signal?: AbortSignal) => api.get<DiscoverPage>("/jobs/discover", { query, signal }),
  track: (id: string) => api.post<Job>(`/jobs/discover/${id}/track`),
  hide: (id: string) => api.put<void>(`/jobs/discover/${id}/hide`),
  unhide: (id: string) => api.delete<void>(`/jobs/discover/${id}/hide`),
  refresh: () => api.post<{ added: number }>("/jobs/discover/refresh"),
};

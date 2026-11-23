import { api, type Page } from "@/lib/api/client";
import type { NewsCategory, NewsItem, NewsSource } from "./types";

type ListQuery = { category?: NewsCategory; q?: string; source?: string; page: number; size: number };

export type FeedPage = Page<NewsItem> & { personalizing: boolean };

export const newsApi = {
  feed: (query: { page: number; size: number }, signal?: AbortSignal) => api.get<FeedPage>("/news/feed", { query, signal }),
  list: (query: ListQuery, signal?: AbortSignal) => api.get<Page<NewsItem>>("/news", { query, signal }),
  saved: (query: { page: number; size: number }, signal?: AbortSignal) =>
    api.get<Page<NewsItem>>("/news/saved", { query, signal }),
  sources: (signal?: AbortSignal) => api.get<NewsSource[]>("/news/sources", { signal }),
  save: (id: string) => api.put<{ is_saved: true }>(`/news/${id}/save`),
  unsave: (id: string) => api.delete<{ is_saved: false }>(`/news/${id}/save`),
  like: (id: string) => api.put<{ is_liked: true }>(`/news/${id}/like`),
  unlike: (id: string) => api.delete<{ is_liked: false }>(`/news/${id}/like`),
  hide: (id: string) => api.put<void>(`/news/${id}/hide`),
  unhide: (id: string) => api.delete<void>(`/news/${id}/hide`),
  opened: (id: string) => api.post<void>(`/news/${id}/open`),
  refresh: () => api.post<{ added: number }>("/news/refresh"),
};

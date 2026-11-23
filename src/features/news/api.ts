import { api, type Page } from "@/lib/api/client";
import type { NewsCategory, NewsItem } from "./types";

type ListQuery = { category?: NewsCategory; q?: string; page: number; size: number };

export const newsApi = {
  list: (query: ListQuery, signal?: AbortSignal) => api.get<Page<NewsItem>>("/news", { query, signal }),
  saved: (query: { page: number; size: number }, signal?: AbortSignal) =>
    api.get<Page<NewsItem>>("/news/saved", { query, signal }),
  save: (id: string) => api.put<{ is_saved: true }>(`/news/${id}/save`),
  unsave: (id: string) => api.delete<{ is_saved: false }>(`/news/${id}/save`),
  refresh: () => api.post<{ added: number }>("/news/refresh"),
};

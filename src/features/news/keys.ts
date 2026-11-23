import type { NewsFeedParams } from "./types";

export const newsKeys = {
  all: ["news"] as const,
  feeds: () => [...newsKeys.all, "feed"] as const,
  feed: (params: NewsFeedParams) => [...newsKeys.feeds(), params] as const,
  savedCount: () => [...newsKeys.all, "saved-count"] as const,
  sources: () => [...newsKeys.all, "sources"] as const,
  story: (source: string) => [...newsKeys.all, "story", source] as const,
};

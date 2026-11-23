import type { NewsCategory, NewsTab } from "./types";

export const NEWS_TABS: { value: NewsTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ai", label: "AI / ML" },
  { value: "web", label: "Web" },
  { value: "cloud", label: "Cloud" },
  { value: "data", label: "Data" },
  { value: "saved", label: "Saved" },
];

export const isNewsTab = (v: string | null): v is NewsTab => NEWS_TABS.some((t) => t.value === v);

/** Cover art used when an article has no image: a gradient per category and a big word. */
export const CATEGORY_META: Record<NewsCategory, { word: string; label: string; cover: string }> = {
  ai: { word: "AI", label: "AI / ML", cover: "bg-brand-gradient" },
  web: { word: "Web", label: "Web", cover: "bg-linear-135 from-info to-cyan" },
  cloud: { word: "Cloud", label: "Cloud", cover: "bg-linear-135 from-status-interview to-primary" },
  data: { word: "Data", label: "Data", cover: "bg-linear-135 from-success to-primary" },
  security: { word: "Sec", label: "Security", cover: "bg-linear-135 from-destructive to-primary-strong" },
};

export const categoryMeta = (c: string) => CATEGORY_META[c as NewsCategory] ?? CATEGORY_META.ai;

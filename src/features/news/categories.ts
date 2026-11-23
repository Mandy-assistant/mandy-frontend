import type { NewsCategory, NewsTab } from "./types";

export const NEWS_TABS: { value: NewsTab; label: string }[] = [
  { value: "foryou", label: "For you" },
  { value: "latest", label: "Latest" },
  { value: "ai", label: "AI / ML" },
  { value: "web", label: "Web" },
  { value: "dev", label: "Dev" },
  { value: "cloud", label: "Cloud" },
  { value: "data", label: "Data" },
  { value: "security", label: "Security" },
  { value: "mobile", label: "Mobile" },
  { value: "career", label: "Career" },
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
  dev: { word: "Dev", label: "Dev", cover: "bg-linear-135 from-primary-strong to-info" },
  mobile: { word: "Mobile", label: "Mobile", cover: "bg-linear-135 from-cyan to-success" },
  career: { word: "Career", label: "Career", cover: "bg-linear-135 from-warning to-destructive" },
};

export const categoryMeta = (c: string) => CATEGORY_META[c as NewsCategory] ?? CATEGORY_META.dev;

/** A stable gradient per source for its story ring / avatar. */
const SOURCE_GRADIENTS = [
  "from-[#f58529] via-[#dd2a7b] to-[#8134af]",
  "from-[#7c5cff] via-[#5b8cff] to-[#22d3ee]",
  "from-[#ff6b6b] via-[#f06595] to-[#845ef7]",
  "from-[#20c997] via-[#22b8cf] to-[#4c6ef5]",
  "from-[#fab005] via-[#fd7e14] to-[#e8590c]",
];

export const sourceGradient = (source: string) => {
  let h = 0;
  for (const ch of source) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SOURCE_GRADIENTS[h % SOURCE_GRADIENTS.length];
};

export const sourceInitials = (source: string) => {
  const clean = source.replace(/^r\//, "");
  const words = clean.split(/[\s._-]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase();
};

export const compactNumber = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);

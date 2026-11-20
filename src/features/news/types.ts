export type NewsCategory = "ai" | "web" | "cloud" | "data" | "security";

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  image_url: string | null;
  category: NewsCategory;
  published_at: string;
  is_saved: boolean;
};

/** Feed tabs on /news. Every tab except "all" and "saved" is a contract category. */
export type NewsTab = "all" | "ai" | "web" | "cloud" | "data" | "saved";

export type NewsFeedParams = { tab: NewsTab; q: string };

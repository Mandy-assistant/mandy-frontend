export type NewsCategory = "ai" | "web" | "cloud" | "data" | "security" | "dev" | "mobile" | "career";
export type NewsKind = "article" | "discussion" | "repo" | "launch";

export type NewsInsight = { relevance: number; reason: string };

export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  summary: string;
  image_url: string | null;
  category: NewsCategory;
  published_at: string;
  kind: NewsKind;
  score: number;
  comments: number;
  discussion_url: string | null;
  author: string | null;
  tags: string[];
  is_saved: boolean;
  is_liked: boolean;
  /** The AI's note on why this matters to you (null until it has looked at it). */
  insight: NewsInsight | null;
};

export type NewsSource = { source: string; count: number; latest_at: string; preview_image: string | null };

/** Feed tabs on /news: the personal feed, newest first, a category, or your saved stories. */
export type NewsTab = "foryou" | "latest" | NewsCategory | "saved";

export type NewsFeedParams = { tab: NewsTab; q: string };

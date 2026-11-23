import type { JobRegion } from "@/features/interests/types";

export type JobFit = { fit: number; reason: string; gaps: string };

export type Posting = {
  id: string;
  source: string;
  url: string;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  regions: string[];
  tags: string[];
  salary: string | null;
  employment_type: string | null;
  summary: string;
  logo_url: string | null;
  posted_at: string;
  /** 0-100 from your interests and skills. */
  match_score: number;
  fit: JobFit | null;
  status: "new" | "hidden" | "tracked";
  job_id: string | null;
};

/** "mine" = your saved regions (the API default). */
export type RegionFilter = "mine" | JobRegion;

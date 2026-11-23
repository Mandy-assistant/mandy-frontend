export type JobRegion = "remote" | "india" | "anywhere";

export type Interests = {
  followed: string[];
  muted: string[];
  job_regions: JobRegion[];
  /** Strongest learned interests, highest first. */
  learned: { term: string; weight: number }[];
  /** What the AI is told about you. */
  context: string;
};

export type InterestsPatch = Partial<Pick<Interests, "followed" | "muted" | "job_regions">>;

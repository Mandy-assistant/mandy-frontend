/** API types for /roadmaps and /milestones (snake_case, per docs/api-contract.md). */
export type RoadmapStatus = "active" | "paused" | "completed";
export type MilestoneStatus = "todo" | "in_progress" | "done";

export type Resource = { title: string; url: string };

export type Roadmap = {
  id: string;
  title: string;
  goal: string | null;
  status: RoadmapStatus;
  /** YYYY-MM-DD */
  target_date: string | null;
  /** 0-100 */
  progress: number;
  milestone_count: number;
  done_count: number;
  created_at: string;
  updated_at: string;
};

export type Milestone = {
  id: string;
  roadmap_id: string;
  title: string;
  description: string | null;
  resources: Resource[];
  position: number;
  status: MilestoneStatus;
  target_date: string | null;
  task_count: number;
  done_task_count: number;
};

export type RoadmapDetail = Roadmap & { milestones: Milestone[] };

export type RoadmapCreate = { title: string; goal?: string | null; target_date?: string | null; status?: RoadmapStatus };
export type RoadmapUpdate = Partial<RoadmapCreate>;

export type MilestoneCreate = {
  title: string;
  description?: string | null;
  resources?: Resource[];
  target_date?: string | null;
  status?: MilestoneStatus;
};
export type MilestoneUpdate = Partial<MilestoneCreate>;

export type RoadmapGenerate = { goal: string; target_date?: string | null; hours_per_week?: number | null };

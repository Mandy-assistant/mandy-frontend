/** API types for /jobs (snake_case, per docs/api-contract.md). */

export const JOB_STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export type Job = {
  id: string;
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  status: JobStatus;
  /** YYYY-MM-DD */
  applied_at: string | null;
  /** ISO datetime (UTC) */
  interview_at: string | null;
  notes: string | null;
  contact: string | null;
  tags: string[];
  position: number;
  created_at: string;
  updated_at: string;
};

export type JobInput = {
  company: string;
  role: string;
  location: string | null;
  url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  status: JobStatus;
  applied_at: string | null;
  interview_at: string | null;
  notes: string | null;
  contact: string | null;
  tags: string[];
};

export type JobStatusChange = { status: JobStatus; position?: number };

export type JobTimelineEvent = {
  id: string;
  from_status: JobStatus | null;
  to_status: JobStatus;
  changed_at: string;
};

export const JOB_SORT_FIELDS = ["updated_at", "company", "role", "status", "applied_at"] as const;
export type JobSortField = (typeof JOB_SORT_FIELDS)[number];
/** `company` ascending, `-company` descending. */
export type JobSort = JobSortField | `-${JobSortField}`;

export type JobListParams = {
  status?: JobStatus;
  q?: string;
  sort?: JobSort;
  page?: number;
  size?: number;
};

export const isJobStatus = (value: unknown): value is JobStatus => JOB_STATUSES.includes(value as JobStatus);

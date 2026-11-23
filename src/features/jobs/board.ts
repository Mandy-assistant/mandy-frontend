import { JOB_STATUSES, type Job, type JobStatus } from "./types";

export type Columns = Record<JobStatus, string[]>;

const byPosition = (a: Job, b: Job) => a.position - b.position || b.updated_at.localeCompare(a.updated_at);

/** Groups jobs into board columns, each ordered by `position`. */
export const groupJobs = (jobs: Job[]): Record<JobStatus, Job[]> => {
  const groups = Object.fromEntries(JOB_STATUSES.map((s) => [s, [] as Job[]])) as Record<JobStatus, Job[]>;
  for (const job of jobs) groups[job.status]?.push(job);
  for (const s of JOB_STATUSES) groups[s].sort(byPosition);
  return groups;
};

export const toColumns = (groups: Record<JobStatus, Job[]>): Columns =>
  Object.fromEntries(JOB_STATUSES.map((s) => [s, groups[s].map((j) => j.id)])) as Columns;

export const findColumn = (columns: Columns, id: string): JobStatus | undefined =>
  JOB_STATUSES.find((s) => columns[s].includes(id));

/**
 * Moves one job to `status` at index `position` and re-numbers the positions of the
 * columns it left and entered, so the board order matches what the server will store.
 */
export const applyMove = (jobs: Job[], id: string, status: JobStatus, position: number): Job[] => {
  const moving = jobs.find((j) => j.id === id);
  if (!moving) return jobs;
  const groups = groupJobs(jobs);
  const from = groups[moving.status].filter((j) => j.id !== id);
  const to = moving.status === status ? from : groups[status].slice();
  const index = Math.max(0, Math.min(position, to.length));
  to.splice(index, 0, { ...moving, status });

  const updated = new Map<string, Job>();
  from.forEach((j, i) => updated.set(j.id, { ...j, position: i }));
  to.forEach((j, i) => updated.set(j.id, { ...j, position: i }));
  return jobs.map((j) => updated.get(j.id) ?? j);
};

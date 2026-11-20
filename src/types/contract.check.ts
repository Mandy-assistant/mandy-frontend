/**
 * Compile-time contract check (FE-14): every hand-written feature type must accept what the API
 * actually returns. Regenerate with `npm run gen:api`; if the backend changes a field, `typecheck` fails here.
 */
import type { DashboardSummary } from "@/features/dashboard/types";
import type { Job } from "@/features/jobs/types";
import type { NewsItem } from "@/features/news/types";
import type { Profile } from "@/features/profile/types";
import type { Resume } from "@/features/resumes/types";
import type { Milestone, Roadmap } from "@/features/roadmaps/types";
import type { Task } from "@/features/tasks/types";
import type { components } from "./api";

/**
 * Fields with a server-side default come out optional in the schema when one Pydantic model serves both
 * request and response, but responses always include them. Treat them as present (null stays nullable).
 */
type Present<T> = T extends readonly (infer U)[]
  ? Present<U>[]
  : T extends object
    ? { [K in keyof T]-?: Present<Exclude<T[K], undefined>> }
    : T;

type S = { [K in keyof components["schemas"]]: Present<components["schemas"][K]> };
type Accepts<Local, Api extends Local> = Api;

export type ContractCheck = [
  Accepts<Job, S["JobOut"]>,
  Accepts<Task, S["TaskOut"]>,
  Accepts<Roadmap, S["RoadmapOut"]>,
  Accepts<Milestone, S["MilestoneOut"]>,
  Accepts<NewsItem, S["NewsItemOut"]>,
  Accepts<Resume, S["ResumeOut"]>,
  Accepts<Profile, S["ProfileOut"]>,
  Accepts<DashboardSummary, S["DashboardSummary"]>,
];

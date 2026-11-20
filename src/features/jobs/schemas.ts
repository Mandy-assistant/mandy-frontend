import { format, isValid, parseISO } from "date-fns";
import { z } from "zod";
import { DEFAULT_CURRENCY } from "./format";
import { JOB_STATUSES, type Job, type JobInput, type JobStatus } from "./types";

const money = z
  .string()
  .trim()
  .regex(/^(\d+(\.\d{1,2})?)?$/, "Use numbers only, e.g. 120000");

const isHttpUrl = (value: string) => {
  try {
    const u = new URL(value);
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
};

const httpUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), "Enter a valid link, e.g. https://jobs.company.com");

export const jobFormSchema = z
  .object({
    company: z.string().trim().min(1, "Company is required").max(120, "Keep it under 120 characters"),
    role: z.string().trim().min(1, "Role is required").max(120, "Keep it under 120 characters"),
    location: z.string().trim().max(120, "Keep it under 120 characters"),
    url: httpUrl,
    salary_min: money,
    salary_max: money,
    currency: z.string().length(3),
    status: z.enum(JOB_STATUSES),
    /** YYYY-MM-DD or "" */
    applied_at: z.string(),
    /** YYYY-MM-DD or "" (date part of interview_at) */
    interview_at: z.string(),
    /** HH:mm or "" */
    interview_time: z.string(),
    contact: z.string().trim().max(200, "Keep it under 200 characters"),
    tags: z.array(z.string().trim().min(1).max(30)).max(10, "Up to 10 tags"),
    notes: z.string().max(5000, "Notes are too long"),
  })
  .superRefine((v, ctx) => {
    if (v.salary_min && v.salary_max && Number(v.salary_max) < Number(v.salary_min)) {
      ctx.addIssue({ code: "custom", path: ["salary_max"], message: "Max must be at least the min salary" });
    }
    if (v.interview_time && !v.interview_at) {
      ctx.addIssue({ code: "custom", path: ["interview_at"], message: "Pick a date for the interview" });
    }
  });

export type JobFormValues = z.infer<typeof jobFormSchema>;

/** Field names the API can return 422 errors for. */
export const JOB_FORM_FIELDS = [
  "company",
  "role",
  "location",
  "url",
  "salary_min",
  "salary_max",
  "currency",
  "status",
  "applied_at",
  "interview_at",
  "contact",
  "tags",
  "notes",
] as const;

export const emptyJobForm = (status: JobStatus = "saved"): JobFormValues => ({
  company: "",
  role: "",
  location: "",
  url: "",
  salary_min: "",
  salary_max: "",
  currency: DEFAULT_CURRENCY,
  status,
  applied_at: "",
  interview_at: "",
  interview_time: "",
  contact: "",
  tags: [],
  notes: "",
});

export const jobToForm = (job: Job): JobFormValues => {
  const interview = job.interview_at ? parseISO(job.interview_at) : null;
  const hasInterview = interview && isValid(interview);
  return {
    company: job.company,
    role: job.role,
    location: job.location ?? "",
    url: job.url ?? "",
    salary_min: job.salary_min?.toString() ?? "",
    salary_max: job.salary_max?.toString() ?? "",
    currency: job.currency || DEFAULT_CURRENCY,
    status: job.status,
    applied_at: job.applied_at ?? "",
    interview_at: hasInterview ? format(interview, "yyyy-MM-dd") : "",
    interview_time: hasInterview ? format(interview, "HH:mm") : "",
    contact: job.contact ?? "",
    tags: job.tags ?? [],
    notes: job.notes ?? "",
  };
};

const orNull = (v: string) => (v.trim() ? v.trim() : null);

/** Form values → API body. Interview date + time are local and sent as UTC ISO. */
export const formToInput = (v: JobFormValues): JobInput => {
  const interview = v.interview_at ? new Date(`${v.interview_at}T${v.interview_time || "09:00"}`) : null;
  return {
    company: v.company.trim(),
    role: v.role.trim(),
    location: orNull(v.location),
    url: orNull(v.url),
    salary_min: v.salary_min ? Number(v.salary_min) : null,
    salary_max: v.salary_max ? Number(v.salary_max) : null,
    currency: v.currency,
    status: v.status,
    applied_at: orNull(v.applied_at),
    interview_at: interview && isValid(interview) ? interview.toISOString() : null,
    contact: orNull(v.contact),
    tags: v.tags,
    notes: orNull(v.notes),
  };
};

import { z } from "zod";

const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

/** Empty, or a full http(s) URL. */
export const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), "Enter a full link, starting with https://");

const text = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`);
const required = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `Keep it under ${max} characters`);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");

/** end_date must not be before start_date (the API answers 422 too). */
const endAfterStart = <T extends { start_date: string; end_date: string }>(v: T, ctx: z.RefinementCtx) => {
  if (v.end_date && v.start_date && v.end_date < v.start_date)
    ctx.addIssue({ code: "custom", path: ["end_date"], message: "End date can't be before the start date" });
};

export const overviewSchema = z.object({
  full_name: required("Your name", 80),
  email: z.string().trim().pipe(z.email("Enter a valid email")),
  headline: text(120),
  summary: text(2000),
  location: text(80),
  phone: text(30).refine((v) => v === "" || /^[+\d][\d\s().-]{5,}$/.test(v), "Enter a valid phone number"),
  links: z.object({ github: optionalUrl, linkedin: optionalUrl, portfolio: optionalUrl, website: optionalUrl }),
  target_roles: z.array(z.string().trim().min(1).max(60)).max(12, "Up to 12 roles"),
});
export type OverviewValues = z.infer<typeof overviewSchema>;

export const experienceSchema = z
  .object({
    title: required("Job title"),
    company: required("Company"),
    location: text(80),
    start_date: isoDate,
    end_date: z.string(),
    current: z.boolean(),
    description: text(2000),
    highlights: text(4000),
  })
  .superRefine((v, ctx) => {
    if (!v.current) endAfterStart(v, ctx);
  });
export type ExperienceValues = z.infer<typeof experienceSchema>;

export const educationSchema = z
  .object({
    school: required("School"),
    degree: required("Degree"),
    field: text(120),
    start_date: isoDate,
    end_date: z.string(),
    grade: text(40),
    description: text(2000),
  })
  .superRefine(endAfterStart);
export type EducationValues = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  name: required("Skill", 60),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  category: z.enum(["language", "framework", "tool", "ml", "other"]),
});
export type SkillValues = z.infer<typeof skillSchema>;

const money = z
  .string()
  .trim()
  .regex(/^\d{0,9}$/, "Whole numbers only");
export const preferencesSchema = z
  .object({
    locations: z.array(z.string().trim().min(1).max(80)).max(15, "Up to 15 locations"),
    work_modes: z.array(z.enum(["remote", "hybrid", "onsite"])),
    salary_min: money,
    salary_max: money,
    currency: z.string().length(3),
  })
  .superRefine((v, ctx) => {
    if (v.salary_min && v.salary_max && Number(v.salary_max) < Number(v.salary_min))
      ctx.addIssue({ code: "custom", path: ["salary_max"], message: "Max can't be lower than min" });
  });
export type PreferencesValues = z.infer<typeof preferencesSchema>;

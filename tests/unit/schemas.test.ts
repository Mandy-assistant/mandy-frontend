import { describe, expect, it } from "vitest";
import { emptyJobForm, jobFormSchema } from "@/features/jobs/schemas";
import { experienceSchema } from "@/features/profile/schemas";

describe("jobFormSchema", () => {
  const base = { ...emptyJobForm(), company: "Vercel", role: "Frontend Engineer" };

  it("accepts a minimal job", () => {
    expect(jobFormSchema.safeParse(base).success).toBe(true);
  });

  it("requires company and role", () => {
    const r = jobFormSchema.safeParse({ ...base, company: " ", role: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(expect.arrayContaining(["company", "role"]));
  });

  it("rejects max salary below min", () => {
    const r = jobFormSchema.safeParse({ ...base, salary_min: "150000", salary_max: "120000" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(["salary_max"]);
  });

  it("needs a date when an interview time is set", () => {
    const r = jobFormSchema.safeParse({ ...base, interview_time: "11:00" });
    expect(r.error?.issues[0]?.path).toEqual(["interview_at"]);
  });
});

describe("experienceSchema", () => {
  const base = {
    title: "Intern",
    company: "Acme",
    location: "",
    start_date: "2025-06-01",
    end_date: "2025-09-01",
    current: false,
    description: "",
    highlights: "",
  };

  it("accepts end after start", () => {
    expect(experienceSchema.safeParse(base).success).toBe(true);
  });

  it("rejects end before start", () => {
    expect(experienceSchema.safeParse({ ...base, end_date: "2025-01-01" }).success).toBe(false);
  });

  it("ignores the end date for a current role", () => {
    expect(experienceSchema.safeParse({ ...base, end_date: "2025-01-01", current: true }).success).toBe(true);
  });
});

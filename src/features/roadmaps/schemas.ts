import { z } from "zod";

export const roadmapFormSchema = z.object({
  title: z.string().trim().min(1, "Give the roadmap a title").max(120, "Keep it under 120 characters"),
  goal: z.string().trim().max(1000).optional(),
  target_date: z.string().nullable(),
});
export type RoadmapFormValues = z.infer<typeof roadmapFormSchema>;

export const planFormSchema = z.object({
  goal: z.string().trim().min(8, "Describe the goal in a few more words").max(500),
  target_date: z.string().nullable(),
  hours_per_week: z.number({ error: "Enter a number" }).int().min(1, "At least 1 hour").max(80, "80 hours max").nullable(),
});
export type PlanFormValues = z.infer<typeof planFormSchema>;

const resourceSchema = z.object({
  title: z.string().trim().max(200),
  url: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "Use a full link (https://…)" })]),
});

export const milestoneFormSchema = z.object({
  title: z.string().trim().min(1, "Give the milestone a title").max(200),
  description: z.string().trim().max(2000).optional(),
  target_date: z.string().nullable(),
  resources: z.array(resourceSchema).max(20),
});
export type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

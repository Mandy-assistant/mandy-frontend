import { z } from "zod";

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Give the task a title").max(200, "Keep it under 200 characters"),
  description: z.string().max(5000).optional(),
  due_date: z.string().nullable(),
  priority: z.enum(["low", "medium", "high"]),
  roadmap_id: z.string().nullable(),
  milestone_id: z.string().nullable(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

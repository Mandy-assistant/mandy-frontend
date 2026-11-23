import { api } from "@/lib/api/client";
import type { AskRequest, AskResponse, AssistantStatus, CreatedJob, CreatedTask, GeneratedRoadmap } from "./types";

export const assistantApi = {
  status: (signal?: AbortSignal) => api.get<AssistantStatus>("/assistant/status", { signal }),
  ask: (body: AskRequest) => api.post<AskResponse>("/assistant/ask", body),
  // Slash commands
  createTask: (body: { title: string }) => api.post<CreatedTask>("/tasks", body),
  createJob: (body: { company: string; role: string; status: "saved" }) => api.post<CreatedJob>("/jobs", body),
  generateRoadmap: (body: { goal: string }) => api.post<GeneratedRoadmap>("/roadmaps/generate", body),
};

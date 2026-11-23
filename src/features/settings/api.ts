import { api } from "@/lib/api/client";

export type AssistantStatus = { enabled: boolean; model: string };

export const settingsApi = {
  assistantStatus: (signal?: AbortSignal) => api.get<AssistantStatus>("/assistant/status", { signal }),
};

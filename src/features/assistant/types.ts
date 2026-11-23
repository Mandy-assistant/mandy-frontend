export type AssistantStatus = { enabled: boolean; model: string };

export type ChatRole = "user" | "model";
export type ChatMessage = { role: ChatRole; content: string };

export type AssistantActionType = "task_created" | "job_created" | "roadmap_created";
export type AssistantAction = { type: AssistantActionType; id: string; title: string };

export type AskRequest = { message: string; history?: ChatMessage[]; tz?: string };
export type AskResponse = { reply: string; actions: AssistantAction[] };

/** Minimal shapes of what the slash commands create (full types live in their own features). */
export type CreatedTask = { id: string; title: string };
export type CreatedJob = { id: string; company: string; role: string };
export type GeneratedRoadmap = { id: string; title: string; milestone_count?: number; milestones?: unknown[] };

/** One turn in the panel under the Ask bar. */
export type Turn =
  | { id: string; role: "user"; content: string }
  | { id: string; role: "model"; status: "pending"; label: string }
  | { id: string; role: "model"; status: "done"; content: string; actions: AssistantAction[] }
  | { id: string; role: "model"; status: "error"; code: string; message: string; retry?: string };

import { api } from "@/lib/api/client";
import type {
  Resume,
  ResumeAIResult,
  ResumeContent,
  ResumeGenerateInput,
  ResumePatch,
  ResumeReviseInput,
  ResumeVersion,
  RewriteKind,
  Template,
} from "./types";

export const resumesApi = {
  list: (signal?: AbortSignal) => api.get<Resume[]>("/resumes", { signal }),
  get: (id: string, signal?: AbortSignal) => api.get<Resume>(`/resumes/${id}`, { signal }),
  create: (body: { title: string; template: Template; content?: ResumeContent }) => api.post<Resume>("/resumes", body),
  fromProfile: (body: { title: string; template: Template }) => api.post<Resume>("/resumes/from-profile", body),
  update: (id: string, body: ResumePatch) => api.patch<Resume>(`/resumes/${id}`, body),
  remove: (id: string) => api.delete(`/resumes/${id}`),
  duplicate: (id: string) => api.post<Resume>(`/resumes/${id}/duplicate`),

  versions: (id: string, signal?: AbortSignal) => api.get<ResumeVersion[]>(`/resumes/${id}/versions`, { signal }),
  saveVersion: (id: string) => api.post<ResumeVersion>(`/resumes/${id}/versions`),
  restore: (id: string, version: number) => api.post<Resume>(`/resumes/${id}/versions/${version}/restore`),
};

export const aiApi = {
  rewrite: (body: { text: string; kind: RewriteKind; instruction?: string }) => api.post<{ text: string }>("/ai/rewrite", body),
  generate: (body: ResumeGenerateInput) => api.post<ResumeAIResult>("/resumes/generate", body),
  revise: (id: string, body: ResumeReviseInput) => api.post<ResumeAIResult>(`/resumes/${id}/revise`, body),
};

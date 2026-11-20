import { api } from "@/lib/api/client";
import type { Education, EducationInput, Experience, ExperienceInput, Profile, ProfileUpdate, Skill, SkillInput } from "./types";

export const profileApi = {
  get: (signal?: AbortSignal) => api.get<Profile>("/profile", { signal }),
  update: (body: ProfileUpdate) => api.put<Profile>("/profile", body),

  addExperience: (body: ExperienceInput) => api.post<Experience>("/profile/experience", body),
  updateExperience: (id: string, body: Partial<ExperienceInput>) => api.patch<Experience>(`/profile/experience/${id}`, body),
  deleteExperience: (id: string) => api.delete(`/profile/experience/${id}`),

  addEducation: (body: EducationInput) => api.post<Education>("/profile/education", body),
  updateEducation: (id: string, body: Partial<EducationInput>) => api.patch<Education>(`/profile/education/${id}`, body),
  deleteEducation: (id: string) => api.delete(`/profile/education/${id}`),

  addSkill: (body: SkillInput) => api.post<Skill>("/profile/skills", body),
  updateSkill: (id: string, body: Partial<SkillInput>) => api.patch<Skill>(`/profile/skills/${id}`, body),
  deleteSkill: (id: string) => api.delete(`/profile/skills/${id}`),
};

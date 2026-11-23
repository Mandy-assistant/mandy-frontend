"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/errors";
import { profileApi } from "./api";
import { profileKeys } from "./keys";
import type { Education, EducationInput, Experience, ExperienceInput, Profile, ProfileUpdate, Skill, SkillInput } from "./types";

export const useProfile = () => useQuery({ queryKey: profileKeys.detail(), queryFn: ({ signal }) => profileApi.get(signal) });

/** PUT /profile. Forms handle 422 themselves (`applyApiErrors`). */
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileUpdate) => profileApi.update(body),
    meta: { silentError: true },
    onSuccess: (profile) => qc.setQueryData(profileKeys.detail(), profile),
  });
};

type ListKey = "experience" | "education" | "skills";
type Item = { id: string };

/** Save (create or patch) + optimistic delete for one of the profile's lists. */
const useCollection = <T extends Item, I>(
  key: ListKey,
  create: (body: I) => Promise<T>,
  update: (id: string, body: Partial<I>) => Promise<T>,
  remove: (id: string) => Promise<unknown>,
  noun: string,
) => {
  const qc = useQueryClient();
  const patch = (fn: (list: T[]) => T[]) =>
    qc.setQueryData<Profile>(profileKeys.detail(), (p) => (p ? { ...p, [key]: fn(p[key] as unknown as T[]) } : p));
  // completeness is computed by the API, so refresh the profile after every change.
  const refresh = () => qc.invalidateQueries({ queryKey: profileKeys.detail() });

  const save = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: I }) => (id ? update(id, body) : create(body)),
    meta: { silentError: true },
    onSuccess: (item, { id }) => {
      patch((list) => (id ? list.map((x) => (x.id === id ? item : x)) : [...list, item]));
      toast.success(id ? `${noun} updated` : `${noun} added`);
      void refresh();
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => remove(id),
    meta: { silentError: true },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: profileKeys.detail() });
      const previous = qc.getQueryData<Profile>(profileKeys.detail());
      patch((list) => list.filter((x) => x.id !== id));
      return { previous };
    },
    onError: (error, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(profileKeys.detail(), ctx.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: () => {
      toast.success(`${noun} deleted`);
      void refresh();
    },
  });

  return { save, remove: del };
};

export const useExperienceMutations = () =>
  useCollection<Experience, ExperienceInput>(
    "experience",
    profileApi.addExperience,
    profileApi.updateExperience,
    profileApi.deleteExperience,
    "Experience",
  );

export const useEducationMutations = () =>
  useCollection<Education, EducationInput>(
    "education",
    profileApi.addEducation,
    profileApi.updateEducation,
    profileApi.deleteEducation,
    "Education",
  );

export const useSkillMutations = () =>
  useCollection<Skill, SkillInput>("skills", profileApi.addSkill, profileApi.updateSkill, profileApi.deleteSkill, "Skill");

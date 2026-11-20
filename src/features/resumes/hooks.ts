"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/errors";
import { aiApi, resumesApi } from "./api";
import { resumeKeys } from "./keys";
import type { Resume, ResumePatch, RewriteKind, Template } from "./types";

export const useResumes = () => useQuery({ queryKey: resumeKeys.list(), queryFn: ({ signal }) => resumesApi.list(signal) });

export const useResume = (id: string) =>
  useQuery({ queryKey: resumeKeys.detail(id), queryFn: ({ signal }) => resumesApi.get(id, signal), staleTime: Infinity });

const useUpsertInList = () => {
  const qc = useQueryClient();
  return (resume: Resume) => {
    qc.setQueryData<Resume[]>(resumeKeys.list(), (list) => (list ? [resume, ...list.filter((r) => r.id !== resume.id)] : list));
    qc.setQueryData(resumeKeys.detail(resume.id), resume);
  };
};

export const useCreateResume = () => {
  const upsert = useUpsertInList();
  return useMutation({
    mutationFn: ({ title, template, fromProfile }: { title: string; template: Template; fromProfile: boolean }) =>
      fromProfile ? resumesApi.fromProfile({ title, template }) : resumesApi.create({ title, template }),
    meta: { silentError: true },
    onSuccess: upsert,
  });
};

export const useDuplicateResume = () => {
  const upsert = useUpsertInList();
  return useMutation({
    mutationFn: (id: string) => resumesApi.duplicate(id),
    onSuccess: (r) => {
      upsert(r);
      toast.success(`Duplicated as “${r.title}”`);
    },
  });
};

/** Optimistic delete with rollback. */
export const useDeleteResume = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resumesApi.remove(id),
    meta: { silentError: true },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: resumeKeys.list() });
      const previous = qc.getQueryData<Resume[]>(resumeKeys.list());
      qc.setQueryData<Resume[]>(resumeKeys.list(), (list) => list?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (error, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(resumeKeys.list(), ctx.previous);
      toast.error(errorMessage(error));
    },
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: resumeKeys.detail(id) });
      toast.success("Resume deleted");
    },
  });
};

/** Autosave PATCH. Doesn't touch the editor's draft; only keeps the caches fresh. */
export const useUpdateResume = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ResumePatch) => resumesApi.update(id, body),
    meta: { silentError: true },
    onSuccess: (r) => {
      qc.setQueryData(resumeKeys.detail(id), r);
      qc.setQueryData<Resume[]>(resumeKeys.list(), (list) => list?.map((x) => (x.id === id ? r : x)));
    },
  });
};

export const useVersions = (id: string, enabled: boolean) =>
  useQuery({ queryKey: resumeKeys.versions(id), queryFn: ({ signal }) => resumesApi.versions(id, signal), enabled });

export const useSaveVersion = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resumesApi.saveVersion(id),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: resumeKeys.versions(id) });
      qc.setQueryData<Resume>(resumeKeys.detail(id), (r) => (r ? { ...r, current_version: v.version } : r));
      toast.success(`Saved as version ${v.version}`);
    },
  });
};

export const useRestoreVersion = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (version: number) => resumesApi.restore(id, version),
    onSuccess: (r, version) => {
      qc.setQueryData(resumeKeys.detail(id), r);
      qc.invalidateQueries({ queryKey: resumeKeys.versions(id) });
      qc.invalidateQueries({ queryKey: resumeKeys.list() });
      toast.success(`Restored version ${version}`);
    },
  });
};

export const useAiRewrite = () =>
  useMutation({
    mutationFn: (body: { text: string; kind: RewriteKind }) => aiApi.rewrite(body),
    meta: { silentError: true },
  });

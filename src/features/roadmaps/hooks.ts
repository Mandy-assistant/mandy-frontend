"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/errors";
import { taskKeys } from "@/features/tasks/keys";
import { roadmapsApi } from "./api";
import { roadmapKeys } from "./keys";
import type { MilestoneCreate, MilestoneUpdate, Roadmap, RoadmapCreate, RoadmapDetail, RoadmapGenerate, RoadmapUpdate } from "./types";

export const useRoadmaps = () => useQuery({ queryKey: roadmapKeys.list(), queryFn: ({ signal }) => roadmapsApi.list(signal) });

export const useRoadmap = (id: string | null | undefined) =>
  useQuery({
    queryKey: roadmapKeys.detail(id ?? ""),
    queryFn: ({ signal }) => roadmapsApi.get(id!, signal),
    enabled: !!id,
  });

/** Progress is derived from milestones, so an optimistic milestone change can update it instantly. */
export const withProgress = (detail: RoadmapDetail): RoadmapDetail => {
  const milestones = [...detail.milestones].sort((a, b) => a.position - b.position);
  const done = milestones.filter((m) => m.status === "done").length;
  return {
    ...detail,
    milestones,
    milestone_count: milestones.length,
    done_count: done,
    progress: milestones.length ? Math.round((done / milestones.length) * 100) : 0,
  };
};

const syncListItem = (qc: QueryClient, detail: RoadmapDetail) => {
  qc.setQueryData<Roadmap[]>(roadmapKeys.list(), (list) =>
    list?.map((r) =>
      r.id === detail.id
        ? { ...r, progress: detail.progress, done_count: detail.done_count, milestone_count: detail.milestone_count, status: detail.status }
        : r,
    ),
  );
};

const invalidateRoadmap = (qc: QueryClient, id?: string) => {
  void qc.invalidateQueries({ queryKey: id ? roadmapKeys.detail(id) : roadmapKeys.details() });
  void qc.invalidateQueries({ queryKey: roadmapKeys.list() });
};

export const useCreateRoadmap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RoadmapCreate) => roadmapsApi.create(body),
    meta: { silentError: true },
    onSuccess: (detail) => {
      qc.setQueryData(roadmapKeys.detail(detail.id), detail);
      void qc.invalidateQueries({ queryKey: roadmapKeys.list() });
    },
  });
};

export const useGenerateRoadmap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RoadmapGenerate) => roadmapsApi.generate(body),
    meta: { silentError: true },
    onSuccess: (detail) => {
      qc.setQueryData(roadmapKeys.detail(detail.id), detail);
      void qc.invalidateQueries({ queryKey: roadmapKeys.list() });
    },
  });
};

export const useUpdateRoadmap = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RoadmapUpdate) => roadmapsApi.update(id, body),
    meta: { silentError: true },
    onSuccess: (detail) => {
      qc.setQueryData(roadmapKeys.detail(id), detail);
      void qc.invalidateQueries({ queryKey: roadmapKeys.list() });
      // Task rows show the roadmap title.
      void qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useDeleteRoadmap = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roadmapsApi.remove(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<Roadmap[]>(roadmapKeys.list(), (list) => list?.filter((r) => r.id !== id));
      qc.removeQueries({ queryKey: roadmapKeys.detail(id) });
      void qc.invalidateQueries({ queryKey: roadmapKeys.list() });
      void qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

export const useCreateMilestone = (roadmapId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: MilestoneCreate) => roadmapsApi.createMilestone(roadmapId, body),
    meta: { silentError: true },
    onSuccess: (milestone) => {
      qc.setQueryData<RoadmapDetail>(roadmapKeys.detail(roadmapId), (d) =>
        d ? withProgress({ ...d, milestones: [...d.milestones.filter((m) => m.id !== milestone.id), milestone] }) : d,
      );
      invalidateRoadmap(qc, roadmapId);
    },
  });
};

/** Optimistic: the timeline, ring and progress bar update before the server answers; rolls back on error. */
export const useUpdateMilestone = (roadmapId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: MilestoneUpdate & { id: string }) => roadmapsApi.updateMilestone(id, body),
    meta: { silentError: true },
    onMutate: async ({ id, ...body }) => {
      await qc.cancelQueries({ queryKey: roadmapKeys.detail(roadmapId) });
      const previous = qc.getQueryData<RoadmapDetail>(roadmapKeys.detail(roadmapId));
      if (previous) {
        const next = withProgress({ ...previous, milestones: previous.milestones.map((m) => (m.id === id ? { ...m, ...body } : m)) });
        qc.setQueryData(roadmapKeys.detail(roadmapId), next);
        syncListItem(qc, next);
      }
      return { previous };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(roadmapKeys.detail(roadmapId), ctx.previous);
        syncListItem(qc, ctx.previous);
      }
      toast.error(errorMessage(error));
    },
    onSettled: () => invalidateRoadmap(qc, roadmapId),
  });
};

export const useDeleteMilestone = (roadmapId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roadmapsApi.removeMilestone(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<RoadmapDetail>(roadmapKeys.detail(roadmapId), (d) =>
        d ? withProgress({ ...d, milestones: d.milestones.filter((m) => m.id !== id) }) : d,
      );
      invalidateRoadmap(qc, roadmapId);
      void qc.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
};

/** Optimistic `PUT /roadmaps/{id}/milestones/order`; restores the old order if the server rejects it. */
export const useReorderMilestones = (roadmapId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => roadmapsApi.reorder(roadmapId, ids),
    meta: { silentError: true },
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: roadmapKeys.detail(roadmapId) });
      const previous = qc.getQueryData<RoadmapDetail>(roadmapKeys.detail(roadmapId));
      if (previous) {
        const byId = new Map(previous.milestones.map((m) => [m.id, m]));
        const milestones = ids.map((id, position) => ({ ...byId.get(id)!, position })).filter((m) => m.id);
        qc.setQueryData(roadmapKeys.detail(roadmapId), { ...previous, milestones });
      }
      return { previous };
    },
    onError: (error, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(roadmapKeys.detail(roadmapId), ctx.previous);
      toast.error(`Couldn't save the new order. ${errorMessage(error)}`);
    },
    onSuccess: (detail) => qc.setQueryData(roadmapKeys.detail(roadmapId), withProgress(detail)),
  });
};


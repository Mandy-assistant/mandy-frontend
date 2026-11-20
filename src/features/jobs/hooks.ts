"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import type { Page } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { jobsApi } from "./api";
import { applyMove } from "./board";
import { jobKeys } from "./keys";
import { statusLabel } from "./status";
import type { Job, JobInput, JobListParams, JobStatus } from "./types";

/** The board loads everything at once and groups client-side. */
export const BOARD_PAGE_SIZE = 200;
export const TABLE_PAGE_SIZE = 20;

export const useJobs = (params: JobListParams, enabled = true) =>
  useQuery({
    queryKey: jobKeys.list(params),
    queryFn: ({ signal }) => jobsApi.list(params, signal),
    placeholderData: keepPreviousData,
    enabled,
  });

/** Detail starts from the copy already in a list, then refreshes. */
export const useJob = (id: string | null, initial?: Job) =>
  useQuery({
    queryKey: jobKeys.detail(id ?? ""),
    queryFn: ({ signal }) => jobsApi.get(id!, signal),
    enabled: !!id,
    placeholderData: initial,
  });

export const useJobTimeline = (id: string | null) =>
  useQuery({
    queryKey: jobKeys.timeline(id ?? ""),
    queryFn: ({ signal }) => jobsApi.timeline(id!, signal),
    enabled: !!id,
  });

type ListSnapshot = [QueryKey, Page<Job> | undefined][];

const restore = (qc: ReturnType<typeof useQueryClient>, lists: ListSnapshot, detail: [QueryKey, Job | undefined]) => {
  for (const [key, data] of lists) qc.setQueryData(key, data);
  qc.setQueryData(detail[0], detail[1]);
};

type MoveVars = { id: string; status: JobStatus; position: number; rollback: () => void; label: string; toastId?: string | number };

/**
 * Status change / reorder with an optimistic update. The cache is written synchronously
 * (so a drop never flashes back), rolled back with an error toast if the API fails.
 */
export const useMoveJob = () => {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ id, status, position }: MoveVars) => jobsApi.setStatus(id, { status, position }),
    meta: { silentError: true },
    onSuccess: (job) => qc.setQueryData(jobKeys.detail(job.id), job),
    onError: (error, vars) => {
      vars.rollback();
      if (vars.toastId !== undefined) toast.dismiss(vars.toastId);
      toast.error(`Couldn't move ${vars.label}. ${errorMessage(error)}`);
    },
    onSettled: (_job, _err, vars) => {
      void qc.invalidateQueries({ queryKey: jobKeys.lists() });
      void qc.invalidateQueries({ queryKey: jobKeys.timeline(vars.id) });
    },
  });
  const { mutate } = mutation;

  const move = useCallback(
    function apply(job: Job, status: JobStatus, position = 0, { notify = job.status !== status } = {}) {
      const lists = qc.getQueriesData<Page<Job>>({ queryKey: jobKeys.lists() });
      const detailKey = jobKeys.detail(job.id);
      const detail: [QueryKey, Job | undefined] = [detailKey, qc.getQueryData<Job>(detailKey)];
      const previous = { status: job.status, position: job.position };

      qc.setQueriesData<Page<Job>>({ queryKey: jobKeys.lists() }, (page) =>
        page ? { ...page, items: applyMove(page.items, job.id, status, position) } : page,
      );
      qc.setQueryData<Job>(detailKey, (d) => (d ? { ...d, status } : d));
      // After the manual write, so a cancelled in-flight fetch reverts to the optimistic data.
      void qc.cancelQueries({ queryKey: jobKeys.lists() });

      const toastId = notify
        ? toast.success(`${job.company} moved to ${statusLabel(status)}`, {
            action: {
              label: "Undo",
              onClick: () => apply({ ...job, status, position }, previous.status, previous.position, { notify: false }),
            },
          })
        : undefined;

      mutate({ id: job.id, status, position, label: job.company, toastId, rollback: () => restore(qc, lists, detail) });
    },
    [qc, mutate],
  );

  return { move, isPending: mutation.isPending };
};

export const useCreateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: JobInput) => jobsApi.create(body),
    meta: { silentError: true },
    onSuccess: (job) => {
      qc.setQueryData(jobKeys.detail(job.id), job);
      void qc.invalidateQueries({ queryKey: jobKeys.lists() });
    },
  });
};

export const useUpdateJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<JobInput> }) => jobsApi.update(id, body),
    meta: { silentError: true },
    onSuccess: (job) => {
      qc.setQueryData(jobKeys.detail(job.id), job);
      qc.setQueriesData<Page<Job>>({ queryKey: jobKeys.lists() }, (page) =>
        page ? { ...page, items: page.items.map((j) => (j.id === job.id ? job : j)) } : page,
      );
      void qc.invalidateQueries({ queryKey: jobKeys.lists() });
      void qc.invalidateQueries({ queryKey: jobKeys.timeline(job.id) });
    },
  });
};

export const useDeleteJob = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (job: Job) => jobsApi.remove(job.id),
    onSuccess: (_void, job) => {
      qc.setQueriesData<Page<Job>>({ queryKey: jobKeys.lists() }, (page) =>
        page ? { ...page, items: page.items.filter((j) => j.id !== job.id), total: Math.max(0, page.total - 1) } : page,
      );
      void qc.invalidateQueries({ queryKey: jobKeys.lists() });
      toast.success(`Deleted ${job.role} at ${job.company}`);
    },
  });
};

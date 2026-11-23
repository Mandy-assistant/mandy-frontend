"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/errors";
import { userTimeZone } from "@/lib/greeting";
import { roadmapKeys } from "@/features/roadmaps";
import { tasksApi } from "./api";
import { taskKeys } from "./keys";
import type { Task, TaskCreate, TaskListParams, TaskUpdate } from "./types";

/* ---------- deferred deletes ----------
 * Delete is optimistic and the DELETE request waits until the Undo toast closes.
 * Undo then just puts the original task back (same id, created_at, links) instead of re-creating a copy.
 * Tasks waiting to be deleted are filtered out of every fetch so a refetch can't resurrect them. */
const pendingDeletes = new Map<string, () => void>();

if (typeof window !== "undefined") {
  // Best effort: send pending deletes when the tab goes away.
  window.addEventListener("pagehide", () => [...pendingDeletes.values()].forEach((commit) => commit()));
}

type ListsSnapshot = [QueryKey, Task[] | undefined][];

const forEachList = (qc: QueryClient, fn: (tasks: Task[], params: TaskListParams) => Task[]) => {
  for (const [key, data] of qc.getQueriesData<Task[]>({ queryKey: taskKeys.lists() })) {
    if (!data) continue;
    qc.setQueryData<Task[]>(key, fn(data, (key[2] ?? {}) as TaskListParams));
  }
};

const snapshotLists = async (qc: QueryClient): Promise<ListsSnapshot> => {
  await qc.cancelQueries({ queryKey: taskKeys.lists() });
  return qc.getQueriesData<Task[]>({ queryKey: taskKeys.lists() });
};

const restoreLists = (qc: QueryClient, snapshot: ListsSnapshot | undefined) =>
  snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));

const patchTask = (qc: QueryClient, id: string, patch: Partial<Task>) =>
  forEachList(qc, (tasks) => tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));

/** Does a task belong in a list fetched with these params? (Only the params the views use.) */
const fitsParams = (task: Task, params: TaskListParams) =>
  (!params.roadmap_id || params.roadmap_id === task.roadmap_id) &&
  (!params.milestone_id || params.milestone_id === task.milestone_id) &&
  (!params.priority || params.priority === task.priority) &&
  !params.filter;

const invalidateRelated = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: taskKeys.lists() });
  // Milestone task counts and roadmap progress depend on tasks.
  void qc.invalidateQueries({ queryKey: roadmapKeys.all });
};

/* ---------- queries ---------- */

/** `GET /tasks` with the user's timezone. Views filter/group client-side so counts stay in sync. */
export const useTasks = (params: Omit<TaskListParams, "tz"> = {}, options: { enabled?: boolean } = {}) => {
  const full: TaskListParams = { ...params, tz: userTimeZone() };
  return useQuery({
    queryKey: taskKeys.list(full),
    queryFn: async ({ signal }) => (await tasksApi.list(full, signal)).filter((t) => !pendingDeletes.has(t.id)),
    enabled: options.enabled ?? true,
  });
};

/* ---------- mutations ---------- */

/**
 * Server id -> the temp id its optimistic row used. Rows are keyed by this (see `rowKey`) so the
 * optimistic row turns into the saved one in place, instead of exiting while a twin enters.
 */
const clientKeys = new Map<string, string>();
export const rowKey = (task: Pick<Task, "id">) => clientKeys.get(task.id) ?? task.id;

export const useCreateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: TaskCreate & { _tempId?: string }) => {
      const { _tempId, ...rest } = body;
      void _tempId;
      return tasksApi.create(rest);
    },
    meta: { silentError: true },
    onMutate: async (body) => {
      const snapshot = await snapshotLists(qc);
      const now = new Date().toISOString();
      const temp: Task = {
        id: body._tempId ?? `temp-${now}`,
        title: body.title,
        description: body.description ?? null,
        due_date: body.due_date ?? null,
        priority: body.priority ?? "medium",
        status: "todo",
        completed_at: null,
        roadmap_id: body.roadmap_id ?? null,
        milestone_id: body.milestone_id ?? null,
        roadmap_title: null,
        milestone_title: null,
        created_at: now,
        updated_at: now,
      };
      forEachList(qc, (tasks, params) => (fitsParams(temp, params) ? [...tasks, temp] : tasks));
      return { snapshot, tempId: temp.id };
    },
    onSuccess: (task, _body, ctx) => {
      if (ctx?.tempId) clientKeys.set(task.id, ctx.tempId);
      forEachList(qc, (tasks) => tasks.map((t) => (t.id === ctx?.tempId ? task : t)));
    },
    onError: (error, _body, ctx) => {
      restoreLists(qc, ctx?.snapshot);
      toast.error(`Couldn't add the task. ${errorMessage(error)}`);
    },
    onSettled: () => invalidateRelated(qc),
  });
};

export const useUpdateTask = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: TaskUpdate & { id: string }) => tasksApi.update(id, body),
    meta: { silentError: true },
    onMutate: async ({ id, ...body }) => {
      const snapshot = await snapshotLists(qc);
      patchTask(qc, id, body as Partial<Task>);
      return { snapshot };
    },
    onSuccess: (task) => patchTask(qc, task.id, task),
    onError: (error, _vars, ctx) => {
      restoreLists(qc, ctx?.snapshot);
      toast.error(`Couldn't save the task. ${errorMessage(error)}`);
    },
    onSettled: () => invalidateRelated(qc),
  });
};

const useToggleTask = (done: boolean) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => (done ? tasksApi.complete(id) : tasksApi.reopen(id)),
    meta: { silentError: true },
    onMutate: async (id) => {
      const snapshot = await snapshotLists(qc);
      const now = new Date().toISOString();
      patchTask(qc, id, done ? { status: "done", completed_at: now, updated_at: now } : { status: "todo", completed_at: null, updated_at: now });
      return { snapshot };
    },
    onSuccess: (task) => patchTask(qc, task.id, task),
    onError: (error, _id, ctx) => {
      restoreLists(qc, ctx?.snapshot);
      toast.error(errorMessage(error));
    },
    onSettled: () => invalidateRelated(qc),
  });
};

/**
 * Complete / reopen / delete with Undo toasts. Shared by the Tasks page and roadmap milestones.
 * Complete is optimistic; Undo reopens the task, which then reappears in its sorted place.
 */
export const useTaskActions = () => {
  const qc = useQueryClient();
  const completeMutation = useToggleTask(true);
  const reopenMutation = useToggleTask(false);
  const { mutate: complete } = completeMutation;
  const { mutate: reopen } = reopenMutation;

  const completeTask = useCallback(
    (task: Task) => {
      complete(task.id);
      toast.success(`Completed “${task.title}”`, {
        id: `task-${task.id}`,
        action: { label: "Undo", onClick: () => reopen(task.id) },
      });
    },
    [complete, reopen],
  );

  const reopenTask = useCallback((task: Task) => reopen(task.id), [reopen]);

  const deleteTask = useCallback(
    (task: Task) => {
      if (pendingDeletes.has(task.id)) return;
      // Remember which lists held the task so Undo can put it back exactly there.
      const holders = qc
        .getQueriesData<Task[]>({ queryKey: taskKeys.lists() })
        .filter(([, data]) => data?.some((t) => t.id === task.id))
        .map(([key]) => key);
      void qc.cancelQueries({ queryKey: taskKeys.lists() });
      forEachList(qc, (tasks) => tasks.filter((t) => t.id !== task.id));

      const restore = () => {
        for (const key of holders) {
          qc.setQueryData<Task[]>(key, (old) => (old && !old.some((t) => t.id === task.id) ? [...old, task] : old));
        }
      };

      let settled = false;
      const commit = () => {
        if (settled) return;
        settled = true;
        pendingDeletes.delete(task.id);
        tasksApi
          .remove(task.id)
          .catch((error) => {
            restore();
            toast.error(`Couldn't delete “${task.title}”. ${errorMessage(error)}`);
          })
          .finally(() => invalidateRelated(qc));
      };
      const undo = () => {
        if (settled) return;
        settled = true;
        pendingDeletes.delete(task.id);
        restore();
      };
      pendingDeletes.set(task.id, commit);

      toast(`Deleted “${task.title}”`, {
        id: `task-${task.id}`,
        action: { label: "Undo", onClick: undo },
        onAutoClose: commit,
        onDismiss: commit,
      });
    },
    [qc],
  );

  return { completeTask, reopenTask, deleteTask };
};

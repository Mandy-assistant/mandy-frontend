"use client";

import { CheckCheck, PartyPopper, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useRoadmaps } from "@/features/roadmaps";
import { useTaskActions, useTasks } from "../hooks";
import type { Task, TaskPriority } from "../types";
import { bucketOf, compareTasks, groupTasks, localISODate, matchesView, useToday, type Bucket, type ViewFilter } from "../utils";
import { TaskEditSheet } from "./TaskEditSheet";
import { TaskFilterCard, TaskFilterRail, type FilterState, type RoadmapOption } from "./TaskFilters";
import { TaskGroups } from "./TaskList";
import { QuickAdd } from "./QuickAdd";

const FILTERS: ViewFilter[] = ["today", "overdue", "upcoming", "completed", "all"];
const parseFilter = (v: string | null): ViewFilter => (FILTERS.includes(v as ViewFilter) ? (v as ViewFilter) : "today");
const parsePriority = (v: string | null): TaskPriority | null => (v === "low" || v === "medium" || v === "high" ? v : null);

const EMPTY: Record<ViewFilter, { title: string; description: string }> = {
  today: { title: "Nothing due today", description: "Add a study task above. New tasks are due today by default." },
  overdue: { title: "You're all caught up", description: "No overdue tasks. Nice work keeping on top of things." },
  upcoming: { title: "Nothing planned yet", description: "Add a task and pick a due date in its details." },
  completed: { title: "No completed tasks yet", description: "Tick a task off and it shows up here." },
  all: { title: "No open tasks here", description: "Add a task above to get started." },
};

export const TasksView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const state: FilterState = {
    filter: parseFilter(searchParams.get("filter")),
    priority: parsePriority(searchParams.get("priority")),
    roadmap: searchParams.get("roadmap") || null,
  };

  const today = useToday();
  const tasks = useTasks();
  const roadmaps = useRoadmaps();
  const actions = useTaskActions();
  const [editing, setEditing] = useState<Task | null>(null);
  const quickAddRef = useRef<HTMLInputElement>(null);

  // Close the sheet when this (kept-alive) route is hidden.
  useEffect(() => () => setEditing(null), []);

  // Command palette: /tasks?new=1 focuses the quick-add input.
  const wantsNew = searchParams.get("new") === "1";
  useEffect(() => {
    if (!wantsNew) return;
    quickAddRef.current?.focus();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("new");
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  }, [wantsNew, searchParams, router, pathname]);

  const setFilters = (patch: Partial<FilterState>) => {
    const next = { ...state, ...patch };
    const params = new URLSearchParams();
    if (next.filter !== "today") params.set("filter", next.filter);
    if (next.priority) params.set("priority", next.priority);
    if (next.roadmap) params.set("roadmap", next.roadmap);
    router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  const view = useMemo(() => {
    if (!tasks.data || !today) return null;
    const all = [...tasks.data].sort(compareTasks);
    const scoped = all.filter((t) => (!state.priority || t.priority === state.priority) && (!state.roadmap || t.roadmap_id === state.roadmap));
    const counts: Record<Bucket, number> = { today: 0, overdue: 0, upcoming: 0, completed: 0 };
    scoped.forEach((t) => counts[bucketOf(t, today)]++);
    const visible = scoped.filter((t) => matchesView(t, state.filter, today));
    const summary = {
      today: all.filter((t) => bucketOf(t, today) === "today").length,
      overdue: all.filter((t) => bucketOf(t, today) === "overdue").length,
      completed: all.filter((t) => t.status === "done" && t.completed_at && localISODate(new Date(t.completed_at)) === today).length,
    };
    return { counts, groups: groupTasks(visible, state.filter, today), summary, total: all.length };
  }, [tasks.data, today, state.filter, state.priority, state.roadmap]);

  const roadmapOptions: RoadmapOption[] = useMemo(() => {
    const open = (id: string) =>
      tasks.data?.filter((t) => t.roadmap_id === id && t.status !== "done" && (!state.priority || t.priority === state.priority)).length ?? 0;
    return (roadmaps.data ?? []).map((r) => ({ id: r.id, title: r.title, open: open(r.id) }));
  }, [roadmaps.data, tasks.data, state.priority]);

  const filterProps = { ...state, counts: view?.counts ?? null, roadmaps: roadmapOptions, onChange: setFilters };

  const description = view ? (
    <span aria-live="polite">
      <b className="font-mono font-semibold text-foreground tabular-nums">{view.summary.today}</b> due today ·{" "}
      <b className={view.summary.overdue ? "font-mono font-semibold text-destructive tabular-nums" : "font-mono font-semibold text-foreground tabular-nums"}>
        {view.summary.overdue}
      </b>{" "}
      overdue · <b className="font-mono font-semibold text-foreground tabular-nums">{view.summary.completed}</b> completed
    </span>
  ) : (
    <span aria-hidden className="shimmer inline-block h-4 w-60 max-w-full rounded-md align-middle" />
  );

  return (
    <>
      <PageHeader overline="Study" title="Tasks" description={description} />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 md:grid-cols-[232px_minmax(0,1fr)] md:gap-6">
        <aside className="hidden md:block">
          <TaskFilterCard {...filterProps} />
        </aside>
        <div className="md:hidden">
          <TaskFilterRail {...filterProps} />
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <QuickAdd inputRef={quickAddRef} />

          {tasks.isError ? (
            <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} title="Couldn't load your tasks" />
          ) : !view ? (
            <ListSkeleton rows={6} />
          ) : view.total === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Your study list is empty"
              description="Add your first task above, or ask Mandy from the Daily Brief to plan your day."
              action={
                <Button variant="outline" onClick={() => quickAddRef.current?.focus()}>
                  Add a task
                </Button>
              }
            />
          ) : view.groups.length === 0 ? (
            <EmptyState
              icon={state.filter === "overdue" ? PartyPopper : CheckCheck}
              title={EMPTY[state.filter].title}
              description={EMPTY[state.filter].description}
              action={
                state.priority || state.roadmap ? (
                  <Button variant="outline" onClick={() => setFilters({ priority: null, roadmap: null })}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <TaskGroups groups={view.groups} today={today!} actions={actions} onOpen={setEditing} />
          )}
        </div>
      </div>

      <TaskEditSheet task={editing} onClose={() => setEditing(null)} actions={actions} />
    </>
  );
};

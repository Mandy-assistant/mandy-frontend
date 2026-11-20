"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";

// Same as @dnd-kit/modifiers' restrictToVerticalAxis (not installed).
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Flag, MoreHorizontal, Pause, Pencil, Play, Plus, Trash2, Trophy } from "lucide-react";
import { motion, useAnimate, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Overline } from "@/components/shared/PageHeader";
import { DetailSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TaskEditSheet, useTaskActions, useTasks, useToday, type Task } from "@/features/tasks";
import { ApiError } from "@/lib/api/errors";
import { easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { roadmapColor } from "../colors";
import { useDeleteMilestone, useDeleteRoadmap, useReorderMilestones, useRoadmap, useRoadmaps, useUpdateMilestone, useUpdateRoadmap } from "../hooks";
import type { Milestone, MilestoneStatus, RoadmapDetail, RoadmapStatus } from "../types";
import { Celebration } from "./Celebration";
import { MilestoneFormDialog } from "./MilestoneFormDialog";
import { MilestoneItem, type TimelineState } from "./MilestoneItem";
import { ProgressRing } from "./ProgressRing";
import { RoadmapFormDialog } from "./RoadmapFormDialog";
import { RoadmapStatusBadge, SoftBadge } from "./StatusBadge";

export const RoadmapDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const roadmap = useRoadmap(id);

  if (roadmap.isError) {
    const notFound = roadmap.error instanceof ApiError && roadmap.error.status === 404;
    return (
      <>
        <BackLink />
        {notFound ? (
          <EmptyState
            icon={Flag}
            title="Roadmap not found"
            description="It may have been deleted."
            action={
              <Button variant="outline" nativeButton={false} render={<Link href="/roadmaps" />}>
                All roadmaps
              </Button>
            }
          />
        ) : (
          <ErrorState error={roadmap.error} onRetry={() => roadmap.refetch()} title="Couldn't load this roadmap" />
        )}
      </>
    );
  }
  if (!roadmap.data) {
    return (
      <>
        <BackLink />
        <DetailSkeleton />
      </>
    );
  }
  return <RoadmapDetailContent detail={roadmap.data} />;
};

const BackLink = () => (
  <Link
    href="/roadmaps"
    className="mb-4 inline-flex h-11 items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8"
  >
    <ArrowLeft className="size-4" aria-hidden />
    Roadmaps
  </Link>
);

const timelineStates = (milestones: Milestone[]): TimelineState[] => {
  const current = milestones.findIndex((m) => m.status === "in_progress");
  const firstOpen = milestones.findIndex((m) => m.status !== "done");
  const cur = current >= 0 ? current : firstOpen;
  return milestones.map((m, i) => (m.status === "done" ? "done" : i === cur ? "current" : "todo"));
};

const RoadmapDetailContent = ({ detail }: { detail: RoadmapDetail }) => {
  const router = useRouter();
  const reduced = useReducedMotion();
  const today = useToday();
  const tasks = useTasks({ roadmap_id: detail.id });
  const taskActions = useTaskActions();
  const updateRoadmap = useUpdateRoadmap(detail.id);
  const deleteRoadmap = useDeleteRoadmap();
  const updateMilestone = useUpdateMilestone(detail.id);
  const deleteMilestone = useDeleteMilestone(detail.id);
  const reorder = useReorderMilestones(detail.id);

  const [editingRoadmap, setEditingRoadmap] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [milestoneDialog, setMilestoneDialog] = useState<{ open: boolean; milestone: Milestone | null }>({ open: false, milestone: null });
  const [deletingMilestone, setDeletingMilestone] = useState<Milestone | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [burst, setBurst] = useState(0);
  const [heroRef, animateHero] = useAnimate<HTMLElement>();

  // Close overlays when this kept-alive route is hidden.
  useEffect(
    () => () => {
      setEditingRoadmap(false);
      setConfirmDelete(false);
      setMilestoneDialog({ open: false, milestone: null });
      setDeletingMilestone(null);
      setEditingTask(null);
    },
    [],
  );

  // Celebrate when progress reaches 100% while the user is here (not on first load).
  const prevProgress = useRef(detail.progress);
  useEffect(() => {
    const prev = prevProgress.current;
    prevProgress.current = detail.progress;
    if (prev >= 100 || detail.progress < 100 || detail.milestone_count === 0) return;
    if (!reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot animation trigger on a data transition
      setBurst((b) => b + 1);
      void animateHero(heroRef.current, { scale: [1, 1.025, 1] }, { duration: 0.6, ease: easeOut });
    }
    toast.success("Roadmap complete. Nice work!", {
      description: detail.status !== "completed" ? "Every milestone is done." : undefined,
      action: detail.status !== "completed" ? { label: "Mark completed", onClick: () => updateRoadmap.mutate({ status: "completed" }) } : undefined,
    });
  }, [detail.progress, detail.milestone_count, detail.status, reduced, animateHero, heroRef, updateRoadmap]);

  const milestones = detail.milestones;
  const states = timelineStates(milestones);
  const tasksByMilestone = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.data?.forEach((t) => {
      if (!t.milestone_id) return;
      map.set(t.milestone_id, [...(map.get(t.milestone_id) ?? []), t]);
    });
    // Open first (due date order), then done.
    map.forEach((list) =>
      list.sort((a, b) =>
        a.status !== b.status ? (a.status === "done" ? 1 : -1) : (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999") || a.created_at.localeCompare(b.created_at),
      ),
    );
    return map;
  }, [tasks.data]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const titleOf = (mid: string | number) => milestones.find((m) => m.id === mid)?.title ?? "milestone";
  const positionOf = (mid: string | number | undefined) => milestones.findIndex((m) => m.id === mid) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}. Position ${positionOf(active.id)} of ${milestones.length}.`,
    onDragOver: ({ active, over }) => (over ? `${titleOf(active.id)} moved to position ${positionOf(over.id)} of ${milestones.length}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `${titleOf(active.id)} dropped at position ${positionOf(over.id)}.` : `${titleOf(active.id)} dropped.`),
    onDragCancel: ({ active }) => `Reordering cancelled. ${titleOf(active.id)} returned.`,
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = milestones.map((m) => m.id);
    reorder.mutate(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  const setStatus = (status: RoadmapStatus) => updateRoadmap.mutate({ status }, { onSuccess: () => toast.success(`Roadmap ${status === "active" ? "resumed" : status}.`) });
  const onMilestoneStatus = (m: Milestone, status: MilestoneStatus) => updateMilestone.mutate({ id: m.id, status });

  return (
    <>
      <BackLink />

      {/* Hero */}
      <motion.section
        ref={heroRef}
        className="relative mb-6 flex flex-col gap-5 overflow-hidden rounded-2xl border bg-card p-5 shadow-card sm:flex-row sm:items-center sm:gap-6 sm:p-7"
        aria-labelledby="roadmap-title"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-brand-gradient opacity-10" />
        <Celebration burst={burst} />
        <div className="relative flex items-center gap-4 sm:contents">
          <ProgressRing value={detail.progress} size={110} label={`${detail.title}: ${detail.progress}% complete`} className="max-sm:size-[92px]!" />
          <div className="flex flex-wrap gap-2 sm:hidden">
            <RoadmapStatusBadge status={detail.status} />
          </div>
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:contents">
              <RoadmapStatusBadge status={detail.status} />
            </span>
            {detail.target_date && <SoftBadge>Target: {format(parseISO(detail.target_date), "MMM d, yyyy")}</SoftBadge>}
          </div>
          <h1 id="roadmap-title" className="mt-2 text-2xl font-bold sm:text-[26px]">
            {detail.title}
          </h1>
          {detail.goal && <p className="mt-1 max-w-2xl text-muted-foreground">{detail.goal}</p>}
          <div className="mt-4 flex max-w-md items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                className="h-full origin-left rounded-full bg-brand-gradient"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: detail.progress / 100 }}
                transition={{ duration: 0.8, ease: easeOut }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums" aria-live="polite">
              {detail.done_count}/{detail.milestone_count} done
            </span>
          </div>
        </div>
        <div className="relative flex gap-2 self-start sm:self-center">
          <Button variant="outline" className="h-11 bg-surface sm:h-9" onClick={() => setEditingRoadmap(true)}>
            <Pencil data-icon="inline-start" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="icon" className="size-11 bg-surface sm:size-9" aria-label="More roadmap actions" />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              {detail.status !== "active" && (
                <DropdownMenuItem onClick={() => setStatus("active")}>
                  <Play />
                  {detail.status === "paused" ? "Resume" : "Reactivate"}
                </DropdownMenuItem>
              )}
              {detail.status === "active" && (
                <DropdownMenuItem onClick={() => setStatus("paused")}>
                  <Pause />
                  Pause
                </DropdownMenuItem>
              )}
              {detail.status !== "completed" && (
                <DropdownMenuItem onClick={() => setStatus("completed")}>
                  <Trophy />
                  Mark completed
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 />
                Delete roadmap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.section>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="milestones-heading" className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="milestones-heading" className="text-lg font-semibold">
              Milestones
            </h2>
            {milestones.length > 1 && <p className="hidden text-xs text-muted-foreground sm:block">Drag the handle (or use space + arrow keys) to reorder</p>}
          </div>

          {milestones.length === 0 ? (
            <EmptyState
              icon={Flag}
              title="No milestones yet"
              description="Split the goal into 4-8 steps you can finish in a week or two each."
              action={
                <Button onClick={() => setMilestoneDialog({ open: true, milestone: null })}>
                  <Plus data-icon="inline-start" />
                  Add the first milestone
                </Button>
              }
            />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd} accessibility={{ announcements }}>
              <SortableContext items={milestones.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <ol className="flex flex-col">
                  {milestones.map((m, i) => (
                    <MilestoneItem
                      key={m.id}
                      milestone={m}
                      index={i}
                      isLast={i === milestones.length - 1}
                      state={states[i]}
                      roadmapId={detail.id}
                      tasks={tasks.data ? (tasksByMilestone.get(m.id) ?? []) : null}
                      today={today}
                      taskActions={taskActions}
                      onOpenTask={setEditingTask}
                      onEdit={(milestone) => setMilestoneDialog({ open: true, milestone })}
                      onDelete={setDeletingMilestone}
                      onStatus={onMilestoneStatus}
                    />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}

          {milestones.length > 0 && (
            <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 sm:gap-4">
              <span aria-hidden className="mx-auto mt-2.5 grid size-7 place-items-center rounded-full border-2 border-dashed text-muted-foreground">
                <Plus className="size-3.5" />
              </span>
              <Button
                variant="outline"
                className="h-12 justify-start rounded-xl border-dashed bg-transparent text-muted-foreground hover:text-foreground"
                onClick={() => setMilestoneDialog({ open: true, milestone: null })}
              >
                Add milestone
              </Button>
            </div>
          )}
        </section>

        <OtherRoadmaps currentId={detail.id} />
      </div>

      <RoadmapFormDialog open={editingRoadmap} onOpenChange={setEditingRoadmap} roadmap={detail} />
      <MilestoneFormDialog
        roadmapId={detail.id}
        open={milestoneDialog.open}
        milestone={milestoneDialog.milestone}
        onOpenChange={(open) => setMilestoneDialog((s) => ({ ...s, open }))}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Delete “${detail.title}”?`}
        description="Its milestones are deleted too. Linked tasks stay in your task list without a roadmap."
        confirmLabel="Delete roadmap"
        onConfirm={() =>
          deleteRoadmap.mutateAsync(detail.id).then(() => {
            toast.success(`Deleted “${detail.title}”`);
            router.push("/roadmaps");
          })
        }
      />
      <ConfirmDialog
        open={!!deletingMilestone}
        onOpenChange={(open) => !open && setDeletingMilestone(null)}
        title={`Delete “${deletingMilestone?.title ?? "milestone"}”?`}
        description="Linked tasks stay in your task list without a milestone."
        confirmLabel="Delete milestone"
        onConfirm={async () => {
          if (deletingMilestone) await deleteMilestone.mutateAsync(deletingMilestone.id);
        }}
      />
      <TaskEditSheet task={editingTask} onClose={() => setEditingTask(null)} actions={taskActions} />
    </>
  );
};

const OtherRoadmaps = ({ currentId }: { currentId: string }) => {
  const roadmaps = useRoadmaps();
  const others = roadmaps.data?.filter((r) => r.id !== currentId) ?? [];
  if (!others.length) return null;
  return (
    <aside aria-labelledby="other-roadmaps" className="rounded-xl border bg-card p-5 shadow-card lg:sticky lg:top-4">
      <Overline className="mb-3">
        <span id="other-roadmaps">Other roadmaps</span>
      </Overline>
      <ul className="flex flex-col gap-2">
        {others.slice(0, 6).map((r) => (
          <li key={r.id}>
            <Link
              href={`/roadmaps/${r.id}`}
              className="block rounded-lg bg-surface-2 px-3.5 py-3 transition-colors outline-none hover:bg-surface-hover focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <i className={cn("size-2 shrink-0 rounded-full", roadmapColor(r.id))} aria-hidden />
                <span className="truncate">{r.title}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{r.progress}%</span>
              </span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-surface">
                <span className="block h-full rounded-full bg-brand-gradient" style={{ width: `${r.progress}%` }} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

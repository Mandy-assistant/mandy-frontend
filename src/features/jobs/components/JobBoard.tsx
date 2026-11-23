"use client";

import {
  closestCorners,
  defaultDropAnimationSideEffects,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Inbox } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { findColumn, groupJobs, toColumns, type Columns } from "../board";
import { useMoveJob } from "../hooks";
import { STATUS_META } from "../status";
import { JOB_STATUSES, isJobStatus, type Job, type JobStatus } from "../types";
import { StatusDot } from "./bits";
import { cardClass, JobCardBody, SortableJobCard } from "./JobCard";

const COLUMN_PREFIX = "column:";
const columnId = (s: JobStatus) => `${COLUMN_PREFIX}${s}`;
const statusFromColumnId = (id: string) => {
  const s = id.startsWith(COLUMN_PREFIX) ? id.slice(COLUMN_PREFIX.length) : null;
  return isJobStatus(s) ? s : undefined;
};

/** Pointer inside a column/card first; keyboard and edge cases fall back to closest corners. */
const collision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  return within.length ? within : closestCorners(args);
};

const dropAnimation: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } }),
};

type JobBoardProps = {
  jobs: Job[];
  /** Only these columns are shown (status filter). */
  statuses: readonly JobStatus[];
  mobile: boolean;
  onOpen: (job: Job) => void;
};

export const JobBoard = ({ jobs, statuses, mobile, onOpen }: JobBoardProps) => {
  const reduced = useReducedMotion();
  const { move } = useMoveJob();
  const byId = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);
  const serverColumns = useMemo(() => toColumns(groupJobs(jobs)), [jobs]);

  // While dragging, the board renders a local arrangement that follows the pointer.
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const columns = dragColumns ?? serverColumns;
  const activeJob = activeId ? byId.get(activeId) : undefined;
  const overStatus = activeId ? findColumn(columns, activeId) : undefined;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter opens the card; Space picks it up and drops it.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  const resolveStatus = useCallback(
    (cols: Columns, id: string | undefined) => (id ? (statusFromColumnId(id) ?? findColumn(cols, id)) : undefined),
    [],
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setDragColumns(serverColumns);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    setDragColumns((prev) => {
      const cols = prev ?? serverColumns;
      const id = String(active.id);
      const from = findColumn(cols, id);
      const to = resolveStatus(cols, String(over.id));
      if (!from || !to || from === to) return prev;
      const target = cols[to];
      const overIndex = target.indexOf(String(over.id));
      const isBelow =
        over.rect && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
      const index = overIndex >= 0 ? overIndex + (isBelow ? 1 : 0) : target.length;
      return {
        ...cols,
        [from]: cols[from].filter((x) => x !== id),
        [to]: [...target.slice(0, index), id, ...target.slice(index)],
      };
    });
  };

  const reset = () => {
    setActiveId(null);
    setDragColumns(null);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    const job = byId.get(id);
    const cols = dragColumns ?? serverColumns;
    const status = over ? resolveStatus(cols, String(over.id)) : undefined;
    if (!job || !status) return reset();

    let list = cols[status];
    const from = list.indexOf(id);
    const to = list.indexOf(String(over!.id));
    if (from >= 0 && to >= 0 && from !== to) list = arrayMove(list, from, to);
    const position = Math.max(0, list.indexOf(id));

    const original = serverColumns[job.status].indexOf(id);
    if (status !== job.status || position !== original) move(job, status, position);
    reset();
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const j = byId.get(String(active.id));
      return j ? `Picked up ${j.role} at ${j.company}.` : "";
    },
    onDragOver: ({ active, over }) => {
      const j = byId.get(String(active.id));
      const s = over ? resolveStatus(columns, String(over.id)) : undefined;
      return j && s ? `${j.company} is over ${STATUS_META[s].label}.` : "";
    },
    onDragEnd: ({ active, over }) => {
      const j = byId.get(String(active.id));
      const s = over ? resolveStatus(columns, String(over.id)) : undefined;
      return j && s ? `${j.company} dropped in ${STATUS_META[s].label}.` : "";
    },
    onDragCancel: ({ active }) => {
      const j = byId.get(String(active.id));
      return j ? `Moving ${j.company} was cancelled.` : "";
    },
  };

  const onStatusChange = useCallback((job: Job, status: JobStatus) => move(job, status, 0), [move]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To move a job, press Space. Use the arrow keys to move it between columns and up or down. Press Space again to drop, or Escape to cancel.",
        },
      }}
    >
      <div
        className={cn(
          // Phones: swipeable columns that peek at the next one. Wider screens: a grid that scrolls when cramped.
          "-mx-4 grid snap-x snap-mandatory scroll-px-4 auto-cols-[82%] grid-flow-col gap-3.5 overflow-x-auto px-4 pb-3 md:mx-0 md:auto-cols-[minmax(200px,1fr)] md:scroll-px-0 md:px-0",
          statuses.length === 1 && "auto-cols-[100%] md:auto-cols-[minmax(200px,420px)]",
        )}
      >
        {statuses.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            ids={columns[status]}
            byId={byId}
            highlighted={overStatus === status}
            dragging={!!activeId}
            mobile={mobile}
            onOpen={onOpen}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={reduced ? null : dropAnimation}>
        {activeJob && (
          // dnd-kit measures the first child: keep the tilt on an inner node so keyboard moves use the real card rect.
          <div>
            <div className={cn(cardClass, "cursor-grabbing shadow-pop ring-2 ring-primary/40", !reduced && "rotate-2 scale-[1.03]")}>
              <JobCardBody job={activeJob} />
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

type BoardColumnProps = {
  status: JobStatus;
  ids: string[];
  byId: Map<string, Job>;
  highlighted: boolean;
  dragging: boolean;
  mobile: boolean;
  onOpen: (job: Job) => void;
  onStatusChange: (job: Job, status: JobStatus) => void;
};

const BoardColumn = ({ status, ids, byId, highlighted, dragging, mobile, onOpen, onStatusChange }: BoardColumnProps) => {
  const { setNodeRef } = useDroppable({ id: columnId(status), data: { type: "column", status } });
  const meta = STATUS_META[status];
  const headingId = `jobs-col-${status}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        "flex min-h-[420px] snap-start flex-col rounded-lg bg-surface-2 px-2.5 pt-3 pb-2.5 transition-[background-color,box-shadow] duration-150",
        highlighted && "bg-primary-soft shadow-[inset_0_0_0_1.5px_var(--color-primary)]",
      )}
    >
      <h2 id={headingId} className="flex items-center gap-2 px-1 pb-3 text-sm font-medium">
        <StatusDot status={status} />
        {meta.label}
        <span className="rounded-full bg-surface px-[7px] font-mono text-xs text-muted-foreground tabular-nums" aria-label={`${ids.length} jobs`}>
          {ids.length}
        </span>
      </h2>

      <SortableContext id={columnId(status)} items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2.5">
          {ids.map((id, i) => {
            const job = byId.get(id);
            return job ? <SortableJobCard key={id} job={job} index={i} mobile={mobile} onOpen={onOpen} onStatusChange={onStatusChange} /> : null;
          })}
          {ids.length === 0 && (
            <div
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1.5 rounded-md border-[1.5px] border-dashed px-4 py-8 text-center text-xs text-muted-foreground transition-colors",
                dragging ? "border-primary/50 text-primary-strong" : "border-border",
              )}
            >
              <Inbox className="size-4" aria-hidden />
              <span className="font-medium">{dragging ? "Drop it here" : "Nothing here yet"}</span>
              <span>{meta.hint}</span>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
};

export const BoardSkeleton = () => (
  <div role="status" aria-label="Loading jobs" className="-mx-4 grid auto-cols-[82%] grid-flow-col gap-3.5 overflow-hidden px-4 md:mx-0 md:auto-cols-[minmax(200px,1fr)] md:px-0">
    {JOB_STATUSES.map((s, c) => (
      <div key={s} className="flex min-h-[420px] flex-col gap-2.5 rounded-lg bg-surface-2 px-2.5 pt-3">
        <div className="flex items-center gap-2 px-1 pb-1.5">
          <StatusDot status={s} />
          <div className="shimmer h-3.5 w-20 rounded-md" />
        </div>
        {Array.from({ length: 3 - (c % 3) }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border bg-card p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="shimmer size-9 rounded-[10px]" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="shimmer h-3.5 w-4/5 rounded-md" />
                <div className="shimmer h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <div className="shimmer h-3 w-2/3 rounded-md" />
            <div className="flex justify-between">
              <div className="shimmer h-5 w-16 rounded-full" />
              <div className="shimmer h-4 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

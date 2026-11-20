"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, parseISO } from "date-fns";
import { CalendarDays, Check, ChevronDown, ExternalLink, GripVertical, ListChecks, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { QuickAdd, TaskItems, type Task } from "@/features/tasks";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { MILESTONE_STATUS } from "../colors";
import type { Milestone, MilestoneStatus } from "../types";
import { MilestoneStatusBadge } from "./StatusBadge";

export type TimelineState = "done" | "current" | "todo";

type TaskActions = Parameters<typeof TaskItems>[0]["actions"];

type MilestoneItemProps = {
  milestone: Milestone;
  index: number;
  isLast: boolean;
  state: TimelineState;
  roadmapId: string;
  /** Linked tasks (null while loading). */
  tasks: Task[] | null;
  today: string | null;
  taskActions: TaskActions;
  onOpenTask: (task: Task) => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestone: Milestone) => void;
  onStatus: (milestone: Milestone, status: MilestoneStatus) => void;
};

const STATUSES: MilestoneStatus[] = ["todo", "in_progress", "done"];

export const MilestoneItem = ({
  milestone,
  index,
  isLast,
  state,
  roadmapId,
  tasks,
  today,
  taskActions,
  onOpenTask,
  onEdit,
  onDelete,
  onStatus,
}: MilestoneItemProps) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: milestone.id });
  const [showTasks, setShowTasks] = useState(state === "current");

  const taskCount = tasks ? tasks.length : milestone.task_count;
  const doneTasks = tasks ? tasks.filter((t) => t.status === "done").length : milestone.done_task_count;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative grid grid-cols-[28px_minmax(0,1fr)] gap-3 sm:gap-4", isDragging && "z-20")}
    >
      {/* Rail: node + connector */}
      <div className="flex flex-col items-center" aria-hidden>
        <span
          className={cn(
            "mt-5 grid size-7 shrink-0 place-items-center rounded-full border-2 bg-surface transition-[background-color,border-color,box-shadow] duration-300",
            state === "done" && "border-primary bg-primary text-primary-foreground",
            state === "current" && "border-[3px] border-primary shadow-[0_0_0_6px_var(--primary-soft)]",
          )}
        >
          {state === "done" && <Check className="size-4" strokeWidth={3} />}
          {state === "current" && <span className="size-2.5 rounded-full bg-primary" />}
        </span>
        {!isLast && <span className={cn("my-1 w-0.5 flex-1 rounded-full transition-colors duration-300", state === "done" ? "bg-primary" : "bg-border")} />}
      </div>

      <article
        aria-label={`Milestone ${index + 1}: ${milestone.title}`}
        className={cn(
          "mb-4 min-w-0 rounded-xl border bg-card p-4 shadow-card transition-[border-color,box-shadow,opacity] sm:p-5",
          state === "current" && "border-primary/60",
          state === "todo" && "opacity-90",
          isDragging && "shadow-pop ring-2 ring-primary/40",
        )}
      >
        <header className="flex items-start gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            aria-label={`Reorder “${milestone.title}”. Press space to pick up, arrow keys to move.`}
            className="-ml-1.5 grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground outline-none hover:bg-surface-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 active:cursor-grabbing sm:size-8"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <div className="min-w-0 flex-1 pt-1.5 sm:pt-0.5">
            <p className="font-mono text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase tabular-nums">Milestone {index + 1}</p>
            <h3 className="text-base font-semibold break-words">{milestone.title}</h3>
          </div>
          <MilestoneStatusBadge status={milestone.status} className="mt-1 hidden sm:inline-flex" />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-sm" className="size-11 shrink-0 sm:size-8" aria-label={`More actions for “${milestone.title}”`} />}
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(milestone)}>
                <Pencil />
                Edit milestone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(milestone)}>
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {milestone.description && <p className="mt-2 text-sm text-muted-foreground">{milestone.description}</p>}

        {milestone.resources.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Resources">
            {milestone.resources.map((r) => (
              <li key={r.url} className="min-w-0">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border bg-surface-2 px-3 text-xs font-medium transition-colors outline-none hover:border-primary/40 hover:text-primary-strong focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="truncate">{r.title}</span>
                  <ExternalLink className="size-3 shrink-0" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-muted-foreground">
          {milestone.target_date && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden />
              {milestone.status === "done" ? "Target" : "Due"} {format(parseISO(milestone.target_date), "MMM d")}
            </span>
          )}
          <button
            type="button"
            aria-expanded={showTasks}
            aria-controls={`ms-tasks-${milestone.id}`}
            onClick={() => setShowTasks((v) => !v)}
            className="-my-2 inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-md px-1 font-medium outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-8"
          >
            <ListChecks className="size-3.5" aria-hidden />
            <span className="font-mono tabular-nums">
              {doneTasks}/{taskCount}
            </span>
            tasks
            <ChevronDown className={cn("size-3.5 transition-transform", showTasks && "rotate-180")} aria-hidden />
          </button>

          <div role="radiogroup" aria-label="Milestone status" className="flex w-full gap-1 rounded-lg bg-surface-2 p-1 sm:ml-auto sm:w-auto">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={milestone.status === s}
                onClick={() => milestone.status !== s && onStatus(milestone, s)}
                className={cn(
                  "h-9 flex-1 cursor-pointer rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-7 sm:flex-none",
                  milestone.status === s
                    ? s === "done"
                      ? "bg-success text-primary-foreground shadow-card"
                      : "bg-surface text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {MILESTONE_STATUS[s].label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence initial={false}>
          {showTasks && (
            <motion.div
              id={`ms-tasks-${milestone.id}`}
              key="tasks"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: duration.base, ease: easeOut }}
              className="overflow-hidden"
            >
              <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                {tasks && today ? (
                  tasks.length > 0 && <TaskItems tasks={tasks} today={today} actions={taskActions} onOpen={onOpenTask} hideLink compact label={`Tasks for ${milestone.title}`} />
                ) : (
                  <p className="text-xs text-muted-foreground">Loading tasks…</p>
                )}
                <QuickAdd roadmapId={roadmapId} milestoneId={milestone.id} dueToday={false} compact placeholder="Add a task" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </article>
    </li>
  );
};

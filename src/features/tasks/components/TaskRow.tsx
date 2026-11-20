"use client";

import { Check, Clock, Pencil, Trash2 } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform, type PanInfo } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { roadmapColor } from "@/features/roadmaps";
import { cn } from "@/utils/cn";
import type { Task } from "../types";
import { dueLabel, isOverdue, priorityDot } from "../utils";
import { TaskCheck } from "./TaskCheck";
import { useCoarsePointer } from "./use-media-query";

/** Time the tick + strike-through play before the row leaves the list. */
const COMPLETE_DELAY = 450;
const SWIPE_THRESHOLD = 96;

export type TaskRowActions = {
  completeTask: (task: Task) => void;
  reopenTask: (task: Task) => void;
  deleteTask: (task: Task) => void;
};

type TaskRowProps = {
  task: Task;
  today: string;
  actions: TaskRowActions;
  onOpen: (task: Task) => void;
  /** Hide the roadmap/milestone badge (e.g. inside a milestone card). */
  hideLink?: boolean;
  compact?: boolean;
};

export const TaskRow = ({ task, today, actions, onOpen, hideLink, compact }: TaskRowProps) => {
  const reduced = useReducedMotion();
  const coarse = useCoarsePointer();
  const temp = task.id.startsWith("temp-");
  // Remember the version we ticked so a later Undo (which bumps updated_at) shows it unticked again.
  const [tickedAt, setTickedAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const done = task.status === "done" || tickedAt === task.updated_at;
  const overdue = isOverdue(task, today);

  const toggle = () => {
    if (temp) return;
    if (task.status === "done") return actions.reopenTask(task);
    if (tickedAt === task.updated_at) return;
    setTickedAt(task.updated_at);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => actions.completeTask(task), reduced ? 0 : COMPLETE_DELAY);
  };

  // Swipe (touch only): right = complete, left = delete.
  const x = useMotionValue(0);
  const completeHint = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const deleteHint = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  // A drag ends with a click on whatever is under the finger; swallow it.
  // (onDragEnd can run after that click, so track "dragging" + when it ended.)
  const drag = useRef<{ active: boolean; endedAt: number }>({ active: false, endedAt: 0 });
  const onDragEnd = (_: unknown, info: PanInfo) => {
    drag.current = { active: false, endedAt: performance.now() };
    if (info.offset.x > SWIPE_THRESHOLD && task.status !== "done") toggle();
    else if (info.offset.x < -SWIPE_THRESHOLD) {
      actions.deleteTask(task);
      return;
    }
    animate(x, 0, { type: "spring", stiffness: 500, damping: 40 });
  };
  const swipe = coarse && !temp;

  const linkLabel = [task.roadmap_title, task.milestone_title].filter(Boolean).join(" · ");

  return (
    <div className="relative">
      {swipe && (
        <div aria-hidden className="absolute inset-0 overflow-hidden rounded-lg">
          <motion.div style={{ opacity: completeHint }} className="absolute inset-0 flex items-center bg-success-soft pl-5 text-success">
            <Check className="size-5" />
          </motion.div>
          <motion.div style={{ opacity: deleteHint }} className="absolute inset-0 flex items-center justify-end bg-destructive-soft pr-5 text-destructive">
            <Trash2 className="size-5" />
          </motion.div>
        </div>
      )}
      <motion.div
        drag={swipe ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        dragSnapToOrigin={false}
        onDragEnd={onDragEnd}
        onDragStart={() => (drag.current.active = true)}
        onClickCapture={(e) => {
          const { active, endedAt } = drag.current;
          if (!active && performance.now() - endedAt > 250) return;
          drag.current.active = false;
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{ x }}
        className={cn(
          "group/task relative flex items-center gap-3 rounded-lg border bg-surface transition-[border-color,box-shadow] hover:border-primary/35 hover:shadow-card",
          compact ? "px-3 py-2" : "px-4 py-3",
          temp && "opacity-70",
        )}
      >
        <TaskCheck checked={done} onToggle={toggle} label={done ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`} disabled={temp} />

        <button
          type="button"
          onClick={() => !temp && onOpen(task)}
          className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-sm py-1 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:gap-3"
        >
          <span className={cn("relative min-w-0 font-medium transition-colors duration-300 sm:flex-1", done && "text-muted-foreground")}>
            <span className="relative inline-block max-w-full align-top break-words sm:truncate">
              {task.title}
              <span
                aria-hidden
                className={cn(
                  "absolute top-[52%] left-0 h-[1.5px] w-full origin-left bg-muted-foreground transition-transform duration-300 ease-out-expo",
                  done ? "scale-x-100" : "scale-x-0",
                )}
              />
            </span>
          </span>

          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
            {!hideLink && linkLabel && task.roadmap_id && (
              <span className="inline-flex max-w-[16rem] items-center gap-1.5 truncate rounded-full bg-primary-soft px-2 py-0.5 font-medium text-primary-strong">
                <i className={cn("size-1.5 shrink-0 rounded-full", roadmapColor(task.roadmap_id))} />
                <span className="truncate">{linkLabel}</span>
              </span>
            )}
            {done ? (
              <span className="inline-flex items-center gap-1 text-success">
                <Check className="size-3" aria-hidden />
                Done
              </span>
            ) : (
              task.due_date && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-mono tabular-nums",
                    overdue && "rounded-full bg-destructive-soft px-2 py-0.5 font-medium text-destructive",
                  )}
                >
                  <Clock className="size-3" aria-hidden />
                  {overdue && <span className="sr-only">Overdue, due </span>}
                  {dueLabel(task.due_date, today)}
                </span>
              )
            )}
            <span className="inline-flex items-center gap-1.5">
              <i className={cn("size-2 rounded-full", priorityDot(task.priority))} aria-hidden />
              <span className="sr-only">{task.priority} priority</span>
            </span>
          </span>
        </button>

        {!temp && (
          <div className="hidden shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-focus-within/task:opacity-100 group-hover/task:opacity-100 sm:flex">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Edit “${task.title}”`} onClick={() => onOpen(task)}>
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="hover:bg-destructive-soft hover:text-destructive"
              aria-label={`Delete “${task.title}”`}
              onClick={() => actions.deleteTask(task)}
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

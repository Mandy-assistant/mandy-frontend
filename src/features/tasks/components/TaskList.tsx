"use client";

import { AnimatePresence, motion } from "motion/react";
import { duration, easeOut } from "@/lib/motion";
import { rowKey } from "../hooks";
import type { Task } from "../types";
import type { TaskGroup } from "../utils";
import { TaskRow, type TaskRowActions } from "./TaskRow";

type TaskItemsProps = {
  tasks: Task[];
  today: string;
  actions: TaskRowActions;
  onOpen: (task: Task) => void;
  hideLink?: boolean;
  compact?: boolean;
  label?: string;
};

/** Rows fade + collapse out and fade in (AnimatePresence); the gap is padding so it collapses too. */
export const TaskItems = ({ tasks, today, actions, onOpen, hideLink, compact, label }: TaskItemsProps) => {
  return (
    <ul className="flex flex-col" aria-label={label}>
      <AnimatePresence initial={false}>
        {tasks.map((task) => (
          <motion.li
            key={rowKey(task)}
            layout="position"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: duration.base, ease: easeOut } }}
            exit={{ opacity: 0, height: 0, overflow: "hidden", transition: { duration: duration.base, ease: easeOut } }}
            className={compact ? "pb-1.5" : "pb-2"}
          >
            <TaskRow task={task} today={today} actions={actions} onOpen={onOpen} hideLink={hideLink} compact={compact} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
};

type TaskGroupsProps = Omit<TaskItemsProps, "tasks" | "label"> & { groups: TaskGroup[] };

export const TaskGroups = ({ groups, ...props }: TaskGroupsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false} mode="popLayout">
        {groups.map((group) => (
          <motion.section
            key={group.key}
            layout="position"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: duration.fast } }}
            aria-labelledby={`group-${group.key}`}
          >
            <h2 id={`group-${group.key}`} className="mb-2 flex items-baseline gap-2 text-[15px] font-semibold">
              {group.label}
              <span className="font-mono text-xs font-medium text-muted-foreground tabular-nums">{group.tasks.length}</span>
            </h2>
            <TaskItems tasks={group.tasks} label={group.label} {...props} />
          </motion.section>
        ))}
      </AnimatePresence>
    </div>
  );
};

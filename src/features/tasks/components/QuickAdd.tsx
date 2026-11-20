"use client";

import { Plus } from "lucide-react";
import { useId, useState, type Ref } from "react";
import { cn } from "@/utils/cn";
import { useCreateTask } from "../hooks";
import type { TaskPriority } from "../types";
import { localISODate } from "../utils";
import { PrioritySelect } from "./PrioritySelect";

type QuickAddProps = {
  inputRef?: Ref<HTMLInputElement>;
  roadmapId?: string | null;
  milestoneId?: string | null;
  /** New tasks are due today unless false. */
  dueToday?: boolean;
  placeholder?: string;
  compact?: boolean;
  className?: string;
};

/** Enter adds a task (due today, medium priority by default). Optimistic: the row appears immediately. */
export const QuickAdd = ({
  inputRef,
  roadmapId,
  milestoneId,
  dueToday = true,
  placeholder = "Add a task, press Enter",
  compact,
  className,
}: QuickAddProps) => {
  const id = useId();
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [announce, setAnnounce] = useState("");
  const create = useCreateTask();

  const submit = () => {
    const value = title.trim();
    if (!value) return;
    create.mutate({
      title: value,
      priority,
      due_date: dueToday ? localISODate() : null,
      roadmap_id: roadmapId ?? null,
      milestone_id: milestoneId ?? null,
      _tempId: `temp-${Date.now()}`,
    });
    setTitle("");
    setAnnounce(`Added “${value}”${dueToday ? " for today" : ""}`);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-surface pr-1.5 pl-4 transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--primary-soft)]",
        compact ? "py-0.5" : "py-1.5",
        className,
      )}
    >
      <Plus className="size-4 shrink-0 text-primary" aria-hidden />
      <label htmlFor={`${id}-title`} className="sr-only">
        New task
      </label>
      <input
        ref={inputRef}
        id={`${id}-title`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          // Explicit: the priority select adds a hidden input, which disables implicit form submission.
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="done"
        maxLength={200}
        className={cn("min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground sm:text-sm", compact ? "h-10" : "h-11")}
      />
      <PrioritySelect
        id={`${id}-priority`}
        aria-label="Priority for the new task"
        value={priority}
        onChange={setPriority}
        className={cn("border-transparent bg-surface-2", compact && "h-9 sm:h-8")}
      />
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </form>
  );
};

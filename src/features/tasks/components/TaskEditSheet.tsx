"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { roadmapColor, useRoadmap, useRoadmaps } from "@/features/roadmaps";
import { cn } from "@/utils/cn";
import { useUpdateTask } from "../hooks";
import { taskFormSchema, type TaskFormValues } from "../schemas";
import type { Task } from "../types";
import { DatePicker } from "./DatePicker";
import { PrioritySelect } from "./PrioritySelect";
import type { TaskRowActions } from "./TaskRow";
import { useIsMobile } from "./use-media-query";

const NONE = "__none__";

type TaskEditSheetProps = {
  task: Task | null;
  onClose: () => void;
  actions: TaskRowActions;
};

/** Side sheet (bottom sheet on mobile) to edit a task. */
export const TaskEditSheet = ({ task, onClose, actions }: TaskEditSheetProps) => {
  const mobile = useIsMobile();
  const popupRef = useRef<HTMLDivElement>(null);
  return (
    <Sheet open={!!task} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        ref={popupRef}
        side={mobile ? "bottom" : "right"}
        // Don't pop the on-screen keyboard on phones: focus the sheet itself there.
        initialFocus={mobile ? popupRef : true}
        className={cn(
          "gap-0 overflow-y-auto",
          "data-[side=bottom]:max-h-[88dvh] data-[side=bottom]:rounded-t-2xl data-[side=bottom]:pb-[env(safe-area-inset-bottom)]",
          "data-[side=right]:inset-y-3 data-[side=right]:right-3 data-[side=right]:h-auto data-[side=right]:w-[calc(100%-1.5rem)] data-[side=right]:rounded-xl data-[side=right]:border data-[side=right]:shadow-pop data-[side=right]:sm:max-w-md",
        )}
      >
        {mobile && <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />}
        {task && <TaskForm key={task.id} task={task} onClose={onClose} actions={actions} />}
      </SheetContent>
    </Sheet>
  );
};

const TaskForm = ({ task, onClose, actions }: { task: Task; onClose: () => void; actions: TaskRowActions }) => {
  const update = useUpdateTask();
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      due_date: task.due_date,
      priority: task.priority,
      roadmap_id: task.roadmap_id,
      milestone_id: task.milestone_id,
    },
  });
  const roadmapId = useWatch({ control: form.control, name: "roadmap_id" });
  const roadmaps = useRoadmaps();
  const roadmap = useRoadmap(roadmapId);

  const roadmapItems: Record<string, string> = { [NONE]: "No roadmap" };
  roadmaps.data?.forEach((r) => (roadmapItems[r.id] = r.title));
  if (task.roadmap_id && !roadmapItems[task.roadmap_id]) roadmapItems[task.roadmap_id] = task.roadmap_title ?? "Roadmap";
  const milestoneItems: Record<string, string> = { [NONE]: "No milestone" };
  roadmap.data?.milestones.forEach((m) => (milestoneItems[m.id] = m.title));
  if (task.milestone_id && roadmapId === task.roadmap_id && !milestoneItems[task.milestone_id])
    milestoneItems[task.milestone_id] = task.milestone_title ?? "Milestone";

  const onSubmit = form.handleSubmit((values) => {
    update.mutate({ id: task.id, ...values, description: values.description?.trim() || null });
    onClose();
  });

  const done = task.status === "done";
  const errors = form.formState.errors;

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col" noValidate>
      <SheetHeader className="px-5 pt-5 pb-2">
        <SheetTitle className="text-xl font-semibold">Edit task</SheetTitle>
        <SheetDescription>{done ? "Completed. Reopen it to keep working on it." : "Changes save when you press Save."}</SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-4 px-5 py-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-title">Title</Label>
          <Input id="task-title" className="h-11 sm:h-9" aria-invalid={!!errors.title} {...form.register("title")} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-description">Description</Label>
          <Textarea id="task-description" rows={3} placeholder="Notes, links, what “done” means…" {...form.register("description")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-due">Due date</Label>
            <Controller
              control={form.control}
              name="due_date"
              render={({ field }) => <DatePicker id="task-due" value={field.value} onChange={field.onChange} />}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="task-priority">Priority</Label>
            <Controller
              control={form.control}
              name="priority"
              render={({ field }) => <PrioritySelect id="task-priority" value={field.value} onChange={field.onChange} className="w-full" />}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-roadmap">Roadmap</Label>
          <Controller
            control={form.control}
            name="roadmap_id"
            render={({ field }) => (
              <Select
                items={roadmapItems}
                value={field.value ?? NONE}
                onValueChange={(v) => {
                  field.onChange(!v || v === NONE ? null : v);
                  form.setValue("milestone_id", null);
                }}
              >
                <SelectTrigger id="task-roadmap" className="h-11 w-full sm:h-9">
                  {field.value && <i className={cn("size-2 shrink-0 rounded-full", roadmapColor(field.value))} aria-hidden />}
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roadmapItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {value !== NONE && <i className={cn("size-2 shrink-0 rounded-full", roadmapColor(value))} aria-hidden />}
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="task-milestone">Milestone</Label>
          <Controller
            control={form.control}
            name="milestone_id"
            render={({ field }) => (
              <Select items={milestoneItems} value={field.value ?? NONE} onValueChange={(v) => field.onChange(!v || v === NONE ? null : v)} disabled={!roadmapId}>
                <SelectTrigger id="task-milestone" className="h-11 w-full sm:h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(milestoneItems).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {!roadmapId && <p className="text-xs text-muted-foreground">Pick a roadmap to link a milestone.</p>}
          {roadmapId && roadmap.isLoading && <p className="text-xs text-muted-foreground">Loading milestones…</p>}
        </div>
      </div>

      <SheetFooter className="mt-auto flex-row flex-wrap items-center gap-2 border-t px-5 py-4">
        <Button
          type="button"
          variant="ghost"
          className="h-11 text-destructive hover:bg-destructive-soft hover:text-destructive sm:h-9"
          onClick={() => {
            onClose();
            actions.deleteTask(task);
          }}
        >
          <Trash2 data-icon="inline-start" />
          Delete
        </Button>
        <div className="ml-auto flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 sm:h-9"
            onClick={() => {
              onClose();
              if (done) actions.reopenTask(task);
              else actions.completeTask(task);
            }}
          >
            {done ? <RotateCcw data-icon="inline-start" /> : <Check data-icon="inline-start" />}
            {done ? "Reopen" : "Complete"}
          </Button>
          <Button type="submit" className="h-11 sm:h-9">
            Save
          </Button>
        </div>
      </SheetFooter>
    </form>
  );
};

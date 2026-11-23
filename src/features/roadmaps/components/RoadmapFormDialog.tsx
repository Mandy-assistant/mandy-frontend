"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/api/form-errors";
import { DatePicker } from "@/features/tasks";
import { useCreateRoadmap, useUpdateRoadmap } from "../hooks";
import { roadmapFormSchema, type RoadmapFormValues } from "../schemas";
import type { Roadmap } from "../types";

type RoadmapFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this roadmap; create a new one when omitted. */
  roadmap?: Roadmap;
};

export const RoadmapFormDialog = ({ open, onOpenChange, roadmap }: RoadmapFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-lg">
      {open && (roadmap ? <EditForm roadmap={roadmap} onDone={() => onOpenChange(false)} /> : <CreateForm onDone={() => onOpenChange(false)} />)}
    </DialogContent>
  </Dialog>
);

const FIELDS = ["title", "goal", "target_date"] as const;

const CreateForm = ({ onDone }: { onDone: () => void }) => {
  const router = useRouter();
  const create = useCreateRoadmap();
  const form = useForm<RoadmapFormValues>({ resolver: zodResolver(roadmapFormSchema), defaultValues: { title: "", goal: "", target_date: null } });
  const submit = form.handleSubmit((values) =>
    create.mutate(
      { ...values, goal: values.goal || null },
      {
        onSuccess: (detail) => {
          toast.success(`Created “${detail.title}”. Add your first milestone.`);
          onDone();
          router.push(`/roadmaps/${detail.id}`);
        },
        onError: (error) => applyApiErrors(error, form.setError, FIELDS),
      },
    ),
  );
  return <RoadmapFields form={form} onSubmit={submit} pending={create.isPending} title="New roadmap" submitLabel="Create roadmap" />;
};

const EditForm = ({ roadmap, onDone }: { roadmap: Roadmap; onDone: () => void }) => {
  const update = useUpdateRoadmap(roadmap.id);
  const form = useForm<RoadmapFormValues>({
    resolver: zodResolver(roadmapFormSchema),
    defaultValues: { title: roadmap.title, goal: roadmap.goal ?? "", target_date: roadmap.target_date },
  });
  const submit = form.handleSubmit((values) =>
    update.mutate(
      { ...values, goal: values.goal || null },
      { onSuccess: onDone, onError: (error) => applyApiErrors(error, form.setError, FIELDS) },
    ),
  );
  return <RoadmapFields form={form} onSubmit={submit} pending={update.isPending} title="Edit roadmap" submitLabel="Save changes" />;
};

type FieldsProps = {
  form: UseFormReturn<RoadmapFormValues>;
  onSubmit: () => void;
  pending: boolean;
  title: string;
  submitLabel: string;
};

const RoadmapFields = ({ form, onSubmit, pending, title, submitLabel }: FieldsProps) => {
  const errors = form.formState.errors;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
      className="grid gap-4"
    >
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        <DialogDescription>What do you want to learn, and by when?</DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="roadmap-title">Title</Label>
        <Input id="roadmap-title" placeholder="Become an ML Engineer" className="h-11 sm:h-9" aria-invalid={!!errors.title} {...form.register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="roadmap-goal">Goal</Label>
        <Textarea id="roadmap-goal" rows={3} placeholder="Go from Python basics to shipping ML models behind an API." {...form.register("goal")} />
        {errors.goal && <p className="text-xs text-destructive">{errors.goal.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="roadmap-target">Target date</Label>
        <Controller
          control={form.control}
          name="target_date"
          render={({ field }) => <DatePicker id="roadmap-target" value={field.value} onChange={field.onChange} shortcuts={false} placeholder="No target date" />}
        />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={pending} className="h-11 sm:h-9">
          {pending ? "Saving…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
};

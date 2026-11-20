"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, Plus, X } from "lucide-react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/api/form-errors";
import { DatePicker } from "@/features/tasks";
import { useCreateMilestone, useUpdateMilestone } from "../hooks";
import { milestoneFormSchema, type MilestoneFormValues } from "../schemas";
import type { Milestone } from "../types";

type MilestoneFormDialogProps = {
  roadmapId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this milestone; create one when omitted. */
  milestone?: Milestone | null;
};

export const MilestoneFormDialog = ({ roadmapId, open, onOpenChange, milestone }: MilestoneFormDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
      {open && <MilestoneForm key={milestone?.id ?? "new"} roadmapId={roadmapId} milestone={milestone} onDone={() => onOpenChange(false)} />}
    </DialogContent>
  </Dialog>
);

const FIELDS = ["title", "description", "target_date", "resources"] as const;

const MilestoneForm = ({ roadmapId, milestone, onDone }: { roadmapId: string; milestone?: Milestone | null; onDone: () => void }) => {
  const create = useCreateMilestone(roadmapId);
  const update = useUpdateMilestone(roadmapId);
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
      target_date: milestone?.target_date ?? null,
      resources: milestone?.resources ?? [],
    },
  });
  const resources = useFieldArray({ control: form.control, name: "resources" });
  const errors = form.formState.errors;

  const submit = form.handleSubmit((values) => {
    const body = {
      title: values.title,
      description: values.description || null,
      target_date: values.target_date,
      resources: values.resources.filter((r) => r.url).map((r) => ({ title: r.title || new URL(r.url).hostname, url: r.url })),
    };
    if (milestone) {
      // Optimistic: the dialog closes right away; errors roll back with a toast.
      update.mutate({ id: milestone.id, ...body });
      onDone();
    } else {
      create.mutate(body, { onSuccess: onDone, onError: (error) => applyApiErrors(error, form.setError, FIELDS) });
    }
  });

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{milestone ? "Edit milestone" : "Add milestone"}</DialogTitle>
        <DialogDescription>A milestone is a chunk you can finish in a week or two.</DialogDescription>
      </DialogHeader>
      <div className="grid gap-1.5">
        <Label htmlFor="ms-title">Title</Label>
        <Input id="ms-title" placeholder="Neural networks with PyTorch" className="h-11 sm:h-9" aria-invalid={!!errors.title} {...form.register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ms-description">Description</Label>
        <Textarea id="ms-description" rows={2} placeholder="Tensors, autograd, training loops" {...form.register("description")} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="ms-target">Target date</Label>
        <Controller
          control={form.control}
          name="target_date"
          render={({ field }) => <DatePicker id="ms-target" value={field.value} onChange={field.onChange} shortcuts={false} placeholder="No target date" />}
        />
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-1.5 text-sm font-medium">Resources</legend>
        {resources.fields.map((field, i) => (
          <div key={field.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-surface-2 p-2 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]">
            <Input placeholder="Title" aria-label={`Resource ${i + 1} title`} className="h-11 bg-surface sm:h-9" {...form.register(`resources.${i}.title`)} />
            <div className="col-span-2 row-start-2 grid gap-1 sm:col-span-1 sm:row-start-auto">
              <Input
                placeholder="https://…"
                type="url"
                inputMode="url"
                aria-label={`Resource ${i + 1} link`}
                className="h-11 bg-surface sm:h-9"
                aria-invalid={!!errors.resources?.[i]?.url}
                {...form.register(`resources.${i}.url`)}
              />
              {errors.resources?.[i]?.url && <p className="text-xs text-destructive">{errors.resources[i]?.url?.message}</p>}
            </div>
            <Button type="button" variant="ghost" size="icon" className="size-11 sm:size-9" aria-label={`Remove resource ${i + 1}`} onClick={() => resources.remove(i)}>
              <X />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="h-10 w-fit sm:h-8" onClick={() => resources.append({ title: "", url: "" })}>
          {resources.fields.length ? <Plus data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
          Add a link
        </Button>
      </fieldset>
      <DialogFooter>
        <Button type="submit" disabled={create.isPending} className="h-11 sm:h-9">
          {milestone ? "Save milestone" : create.isPending ? "Adding…" : "Add milestone"}
        </Button>
      </DialogFooter>
    </form>
  );
};

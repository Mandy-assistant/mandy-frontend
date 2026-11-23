"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/api/form-errors";
import { cn } from "@/utils/cn";
import { CURRENCIES } from "../format";
import { useCreateJob, useUpdateJob } from "../hooks";
import { emptyJobForm, formToInput, JOB_FORM_FIELDS, jobFormSchema, jobToForm, type JobFormValues } from "../schemas";
import { statusLabel } from "../status";
import type { Job, JobStatus } from "../types";
import { DateField } from "./DateField";
import { StatusSelect } from "./StatusSelect";
import { TagInput } from "./TagInput";

const Field = ({
  label,
  id,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
    <Label htmlFor={id} className="text-[13px]">
      {label}
    </Label>
    {children}
    {error ? (
      <p id={`${id}-error`} role="alert" className="text-xs font-medium text-destructive">
        {error}
      </p>
    ) : hint ? (
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {hint}
      </p>
    ) : null}
  </div>
);

const inputClass = "h-9 max-md:h-11";

type JobFormProps = {
  job?: Job;
  defaultStatus?: JobStatus;
  onDone: (job: Job) => void;
  onCancel: () => void;
};

export const JobForm = ({ job, defaultStatus, onDone, onCancel }: JobFormProps) => {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const create = useCreateJob();
  const update = useUpdateJob();
  const pending = create.isPending || update.isPending;

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: job ? jobToForm(job) : emptyJobForm(defaultStatus),
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = form;

  const describe = (name: keyof JobFormValues) => (errors[name] ? `${id(name)}-error` : undefined);
  const textField = (name: keyof JobFormValues) => ({
    id: id(name),
    "aria-invalid": !!errors[name] || undefined,
    "aria-describedby": describe(name),
    className: inputClass,
  });

  const onSubmit = handleSubmit((values) => {
    const body = formToInput(values);
    const handlers = {
      onSuccess: (saved: Job) => {
        toast.success(job ? `Saved changes to ${saved.company}` : `Added ${saved.company} to ${statusLabel(saved.status)}`);
        onDone(saved);
      },
      onError: (error: unknown) => applyApiErrors(error, setError, JOB_FORM_FIELDS),
    };
    if (job) update.mutate({ id: job.id, body }, handlers);
    else create.mutate(body, handlers);
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto px-5 pt-1 pb-5 sm:grid-cols-2">
        <Field label="Company" id={id("company")} error={errors.company?.message}>
          <Input {...register("company")} {...textField("company")} placeholder="Vercel" autoComplete="organization" autoFocus />
        </Field>
        <Field label="Role" id={id("role")} error={errors.role?.message}>
          <Input {...register("role")} {...textField("role")} placeholder="Frontend Engineer" autoComplete="organization-title" />
        </Field>
        <Field label="Location" id={id("location")} error={errors.location?.message}>
          <Input {...register("location")} {...textField("location")} placeholder="Remote, Bengaluru…" />
        </Field>
        <Field label="Job link" id={id("url")} error={errors.url?.message}>
          <Input {...register("url")} {...textField("url")} type="url" inputMode="url" placeholder="https://…" />
        </Field>

        <fieldset className="grid grid-cols-[1fr_1fr_6.5rem] gap-2 sm:col-span-2">
          <legend className="sr-only">Salary range</legend>
          <Field label="Salary min" id={id("salary_min")} error={errors.salary_min?.message}>
            <Input {...register("salary_min")} {...textField("salary_min")} inputMode="decimal" placeholder="120000" className={cn(inputClass, "font-mono tabular-nums")} />
          </Field>
          <Field label="Salary max" id={id("salary_max")} error={errors.salary_max?.message}>
            <Input {...register("salary_max")} {...textField("salary_max")} inputMode="decimal" placeholder="150000" className={cn(inputClass, "font-mono tabular-nums")} />
          </Field>
          <Field label="Currency" id={id("currency")} error={errors.currency?.message}>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(v) => v && field.onChange(v)}>
                  <SelectTrigger id={id("currency")} className="h-9! w-full font-mono max-md:h-11!">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c} className="font-mono">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </fieldset>

        <Field label="Status" id={id("status")} error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <StatusSelect id={id("status")} value={field.value} onChange={field.onChange} label="Status" className="h-9! w-full max-md:h-11!" />
            )}
          />
        </Field>
        <Field label="Applied on" id={id("applied_at")} error={errors.applied_at?.message}>
          <Controller
            control={control}
            name="applied_at"
            render={({ field }) => (
              <DateField id={id("applied_at")} value={field.value} onChange={field.onChange} invalid={!!errors.applied_at} aria-describedby={describe("applied_at")} />
            )}
          />
        </Field>

        <Field label="Interview date" id={id("interview_at")} error={errors.interview_at?.message}>
          <Controller
            control={control}
            name="interview_at"
            render={({ field }) => (
              <DateField
                id={id("interview_at")}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.interview_at}
                aria-describedby={describe("interview_at")}
                placeholder="No interview yet"
              />
            )}
          />
        </Field>
        <Field label="Interview time" id={id("interview_time")} error={errors.interview_time?.message}>
          <Input {...register("interview_time")} {...textField("interview_time")} type="time" className={cn(inputClass, "font-mono")} />
        </Field>

        <Field label="Contact" id={id("contact")} error={errors.contact?.message} hint="Recruiter or referral — name, email or LinkedIn" className="sm:col-span-2">
          <Input {...register("contact")} {...textField("contact")} placeholder="Priya · priya@vercel.com" />
        </Field>

        <Field label="Tags" id={id("tags")} error={errors.tags?.message ?? errors.tags?.[0]?.message} hint="Press Enter or comma to add" className="sm:col-span-2">
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagInput id={id("tags")} value={field.value} onChange={field.onChange} invalid={!!errors.tags} placeholder="react, remote, referral…" />
            )}
          />
        </Field>

        <Field label="Notes" id={id("notes")} error={errors.notes?.message} className="sm:col-span-2">
          <Textarea
            {...register("notes")}
            id={id("notes")}
            aria-invalid={!!errors.notes || undefined}
            rows={4}
            placeholder="What stood out, prep ideas, questions to ask…"
            className="min-h-24"
          />
        </Field>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t bg-muted/40 px-5 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end md:pb-3.5">
        <Button type="button" variant="outline" onClick={onCancel} className="max-md:h-11">
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="max-md:h-11">
          {pending && <Loader2 className="animate-spin" data-icon="inline-start" aria-hidden />}
          {job ? "Save changes" : "Add job"}
        </Button>
      </div>
    </form>
  );
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, FilePlus2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { describedBy, Field, FormActions, inputClass } from "@/features/profile/components/form-kit";
import { ResponsiveDialog } from "@/features/profile/components/ResponsiveDialog";
import { applyApiErrors } from "@/lib/api/form-errors";
import { cn } from "@/utils/cn";
import { useCreateResume } from "../hooks";
import { TemplateThumb } from "./TemplateThumb";

const schema = z.object({
  title: z.string().trim().min(1, "Give it a name, like “ML Engineer Intern”").max(80, "Keep it under 80 characters"),
  template: z.enum(["modern", "classic"]),
  source: z.enum(["blank", "profile"]),
});
type Values = z.infer<typeof schema>;

const Choice = ({
  selected,
  onClick,
  children,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    aria-label={label}
    onClick={onClick}
    className={cn(
      "relative flex flex-col gap-2 rounded-2xl border-[1.5px] p-3 text-left transition-[border-color,background-color]",
      selected ? "border-primary bg-primary-soft/50" : "border-border hover:border-primary/40",
    )}
  >
    {selected && (
      <span className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
        <Check className="size-3" strokeWidth={3} aria-hidden />
      </span>
    )}
    {children}
  </button>
);

export const NewResumeDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => (
  <ResponsiveDialog
    open={open}
    onOpenChange={onOpenChange}
    title="New resume"
    description="One resume per kind of role works best."
  >
    {open && <NewResumeForm onDone={() => onOpenChange(false)} />}
  </ResponsiveDialog>
);

const NewResumeForm = ({ onDone }: { onDone: () => void }) => {
  const router = useRouter();
  const create = useCreateResume();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", template: "modern", source: "profile" },
  });
  const { register, control, handleSubmit, formState, setError } = form;

  const onSubmit = handleSubmit(async (v) => {
    try {
      const r = await create.mutateAsync({ title: v.title, template: v.template, fromProfile: v.source === "profile" });
      toast.success(v.source === "profile" ? "Resume created from your profile" : "Resume created");
      onDone();
      router.push(`/resumes/${r.id}`);
    } catch (error) {
      applyApiErrors(error, setError, ["title", "template"]);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
      <Field label="Name" htmlFor="nr-title" error={formState.errors.title?.message} hint="Only you see this.">
        <Input
          id="nr-title"
          autoFocus
          placeholder="ML Engineer Intern"
          aria-invalid={!!formState.errors.title || undefined}
          aria-describedby={describedBy("nr-title")}
          className={inputClass}
          {...register("title")}
        />
      </Field>
      <Controller
        control={control}
        name="source"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium text-foreground/85" id="nr-source">
              Start from
            </p>
            <div role="radiogroup" aria-labelledby="nr-source" className="grid gap-2.5 sm:grid-cols-2">
              <Choice selected={field.value === "profile"} onClick={() => field.onChange("profile")} label="Import from profile">
                <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-white">
                  <UserRound className="size-4" aria-hidden />
                </span>
                <span className="font-semibold">Import from profile</span>
                <span className="text-xs text-muted-foreground">Experience, education and skills filled in.</span>
              </Choice>
              <Choice selected={field.value === "blank"} onClick={() => field.onChange("blank")} label="Blank resume">
                <span className="grid size-9 place-items-center rounded-xl bg-surface-2 text-muted-foreground">
                  <FilePlus2 className="size-4" aria-hidden />
                </span>
                <span className="font-semibold">Blank</span>
                <span className="text-xs text-muted-foreground">Start with empty sections.</span>
              </Choice>
            </div>
          </div>
        )}
      />
      <Controller
        control={control}
        name="template"
        render={({ field }) => (
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] font-medium text-foreground/85" id="nr-template">
              Template
            </p>
            <div role="radiogroup" aria-labelledby="nr-template" className="grid grid-cols-2 gap-2.5">
              {(["modern", "classic"] as const).map((t) => (
                <Choice
                  key={t}
                  selected={field.value === t}
                  onClick={() => field.onChange(t)}
                  label={t === "modern" ? "Modern" : "Classic"}
                >
                  <TemplateThumb template={t} />
                  <span className="font-semibold">{t === "modern" ? "Modern" : "Classic"}</span>
                </Choice>
              ))}
            </div>
          </div>
        )}
      />
      <FormActions saving={create.isPending} onCancel={onDone} label="Create resume" />
    </form>
  );
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Briefcase, MapPin, Plus } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/api/form-errors";
import { useHydrated } from "@/lib/use-hydrated";
import { dateRange, durationLabel } from "../format";
import { useExperienceMutations } from "../hooks";
import { experienceSchema, type ExperienceValues } from "../schemas";
import type { Experience } from "../types";
import { describedBy, Field, FormActions, inputClass, textareaClass } from "./form-kit";
import { ItemCard } from "./ItemCard";
import { ListHeader } from "./ListHeader";
import { ResponsiveDialog } from "./ResponsiveDialog";

const sortExperience = (items: Experience[]) =>
  [...items].sort((a, b) => Number(b.current) - Number(a.current) || (b.start_date ?? "").localeCompare(a.start_date ?? ""));

export const ExperienceTab = ({ items }: { items: Experience[] }) => {
  const { remove } = useExperienceMutations();
  const [editing, setEditing] = useState<Experience | "new" | null>(null);
  const [deleting, setDeleting] = useState<Experience | null>(null);
  const hydrated = useHydrated();
  const now = hydrated ? new Date() : null;

  return (
    <div className="flex flex-col gap-4">
      <ListHeader
        title="Work experience"
        description="Roles, internships and freelance work. Newest first."
        action={
          <Button onClick={() => setEditing("new")} className="h-10">
            <Plus data-icon="inline-start" /> Add experience
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No experience yet"
          description="Add internships, jobs or freelance projects. They flow straight into your resumes."
          action={
            <Button variant="outline" onClick={() => setEditing("new")}>
              <Plus data-icon="inline-start" /> Add your first role
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {sortExperience(items).map((x) => (
              <ItemCard
                key={x.id}
                label={`${x.title} at ${x.company}`}
                monogram={x.company.charAt(0).toUpperCase()}
                title={x.title}
                subtitle={
                  <>
                    {x.company}
                    {x.location && (
                      <span className="inline-flex items-center gap-1">
                        <span aria-hidden className="mx-1.5">
                          ·
                        </span>
                        <MapPin className="size-3" aria-hidden />
                        {x.location}
                      </span>
                    )}
                  </>
                }
                badge={
                  x.current ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 font-medium text-success">
                      <span className="size-1.5 rounded-full bg-current" aria-hidden /> Current
                    </span>
                  ) : undefined
                }
                meta={
                  <span className="font-mono tabular-nums">
                    {dateRange(x.start_date, x.end_date, x.current)}
                    {now && x.start_date && (
                      <span className="text-muted-foreground/80">
                        {" "}
                        · {durationLabel(x.start_date, x.current ? null : x.end_date, now)}
                      </span>
                    )}
                  </span>
                }
                onEdit={() => setEditing(x)}
                onDelete={() => setDeleting(x)}
              >
                {x.description && (
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground/85">{x.description}</p>
                )}
                {x.highlights.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1.5">
                    {x.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-foreground/85">
                        <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-gradient" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
              </ItemCard>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ExperienceDialog editing={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this role?"
        description={deleting ? `${deleting.title} at ${deleting.company} will be removed from your profile.` : undefined}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </div>
  );
};

const EMPTY: ExperienceValues = {
  title: "",
  company: "",
  location: "",
  start_date: "",
  end_date: "",
  current: false,
  description: "",
  highlights: "",
};

const toValues = (x: Experience): ExperienceValues => ({
  title: x.title,
  company: x.company,
  location: x.location ?? "",
  start_date: x.start_date ?? "",
  end_date: x.end_date ?? "",
  current: x.current,
  description: x.description ?? "",
  highlights: x.highlights.join("\n"),
});

const FIELDS = ["title", "company", "location", "start_date", "end_date", "current", "description", "highlights"] as const;

const ExperienceDialog = ({ editing, onClose }: { editing: Experience | "new" | null; onClose: () => void }) => {
  const open = editing !== null;
  // Remount the form for each item so defaults are fresh.
  const key = editing === "new" ? "new" : (editing?.id ?? "closed");
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={editing === "new" ? "Add experience" : "Edit experience"}
      description="Dates, impact and the highlights you want on your resume."
    >
      {open && <ExperienceForm key={key} item={editing === "new" ? null : editing} onDone={onClose} />}
    </ResponsiveDialog>
  );
};

const ExperienceForm = ({ item, onDone }: { item: Experience | null; onDone: () => void }) => {
  const { save } = useExperienceMutations();
  const form = useForm<ExperienceValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: item ? toValues(item) : EMPTY,
  });
  const { register, handleSubmit, formState, setError, setValue, control } = form;
  const e = formState.errors;
  const current = useWatch({ control, name: "current" });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: item?.id,
        body: {
          title: v.title,
          company: v.company,
          location: v.location || null,
          start_date: v.start_date,
          end_date: v.current ? null : v.end_date || null,
          current: v.current,
          description: v.description || null,
          highlights: v.highlights
            .split("\n")
            .map((h) => h.replace(/^[-•*]\s*/, "").trim())
            .filter(Boolean),
        },
      });
      onDone();
    } catch (error) {
      applyApiErrors(error, setError, FIELDS);
    }
  });

  const input = (
    id: keyof ExperienceValues,
    label: string,
    opts: { type?: string; placeholder?: string; optional?: boolean; disabled?: boolean } = {},
  ) => (
    <Field label={label} htmlFor={`ex-${id}`} error={e[id]?.message} optional={opts.optional}>
      <Input
        id={`ex-${id}`}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        disabled={opts.disabled}
        aria-invalid={!!e[id] || undefined}
        aria-describedby={describedBy(`ex-${id}`)}
        className={inputClass}
        {...register(id)}
      />
    </Field>
  );

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {input("title", "Job title", { placeholder: "Frontend Developer" })}
        {input("company", "Company", { placeholder: "Acme Corp" })}
        <div className="sm:col-span-2">{input("location", "Location", { placeholder: "Remote", optional: true })}</div>
        {input("start_date", "Start date", { type: "date" })}
        {input("end_date", "End date", { type: "date", disabled: current })}
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-surface-2/60 px-3.5 text-sm font-medium">
        <Checkbox
          checked={current}
          onCheckedChange={(c) => {
            setValue("current", !!c, { shouldDirty: true });
            if (c) setValue("end_date", "");
          }}
        />
        I currently work here
      </label>
      <Field label="Description" htmlFor="ex-description" error={e.description?.message} optional>
        <Textarea
          id="ex-description"
          rows={3}
          className={textareaClass}
          placeholder="What the team does and what you owned."
          {...register("description")}
        />
      </Field>
      <Field
        label="Highlights"
        htmlFor="ex-highlights"
        error={e.highlights?.message}
        hint="One per line. Start with a verb and add numbers."
        optional
      >
        <Textarea
          id="ex-highlights"
          rows={4}
          className={textareaClass}
          aria-describedby={describedBy("ex-highlights")}
          placeholder={"Cut page load time by 40% with code splitting\nShipped the onboarding flow used by 20k users"}
          {...register("highlights")}
        />
      </Field>
      <FormActions saving={save.isPending} onCancel={onDone} label={item ? "Save changes" : "Add experience"} />
    </form>
  );
};

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Award, GraduationCap, Plus } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyApiErrors } from "@/lib/api/form-errors";
import { dateRange } from "../format";
import { useEducationMutations } from "../hooks";
import { educationSchema, type EducationValues } from "../schemas";
import type { Education } from "../types";
import { describedBy, Field, FormActions, inputClass, textareaClass } from "./form-kit";
import { ItemCard } from "./ItemCard";
import { ListHeader } from "./ListHeader";
import { ResponsiveDialog } from "./ResponsiveDialog";

export const EducationTab = ({ items }: { items: Education[] }) => {
  const { remove } = useEducationMutations();
  const [editing, setEditing] = useState<Education | "new" | null>(null);
  const [deleting, setDeleting] = useState<Education | null>(null);
  const sorted = [...items].sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));

  return (
    <div className="flex flex-col gap-4">
      <ListHeader
        title="Education"
        description="Degrees, bootcamps and certifications."
        action={
          <Button onClick={() => setEditing("new")} className="h-10">
            <Plus data-icon="inline-start" /> Add education
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No education yet"
          description="Add your degree or a course you completed."
          action={
            <Button variant="outline" onClick={() => setEditing("new")}>
              <Plus data-icon="inline-start" /> Add education
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          <AnimatePresence initial={false}>
            {sorted.map((x) => (
              <ItemCard
                key={x.id}
                label={x.degree ? `${x.degree} at ${x.school}` : x.school}
                monogram={x.school.charAt(0).toUpperCase()}
                title={[x.degree, x.field].filter(Boolean).join(", ")}
                subtitle={x.school}
                meta={<span className="font-mono tabular-nums">{dateRange(x.start_date, x.end_date)}</span>}
                badge={
                  x.grade ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cyan-soft px-2.5 py-0.5 font-medium text-cyan">
                      <Award className="size-3" aria-hidden /> {x.grade}
                    </span>
                  ) : undefined
                }
                onEdit={() => setEditing(x)}
                onDelete={() => setDeleting(x)}
              >
                {x.description && (
                  <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-foreground/85">{x.description}</p>
                )}
              </ItemCard>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <ResponsiveDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        title={editing === "new" ? "Add education" : "Edit education"}
        description="School, degree and dates."
      >
        {editing !== null && (
          <EducationForm
            key={editing === "new" ? "new" : editing.id}
            item={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </ResponsiveDialog>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this education entry?"
        description={deleting ? `${deleting.degree ? `${deleting.degree} at ` : ""}${deleting.school} will be removed.` : undefined}
        onConfirm={() => {
          if (deleting) remove.mutate(deleting.id);
        }}
      />
    </div>
  );
};

const EMPTY: EducationValues = { school: "", degree: "", field: "", start_date: "", end_date: "", grade: "", description: "" };
const FIELDS = ["school", "degree", "field", "start_date", "end_date", "grade", "description"] as const;

const EducationForm = ({ item, onDone }: { item: Education | null; onDone: () => void }) => {
  const { save } = useEducationMutations();
  const form = useForm<EducationValues>({
    resolver: zodResolver(educationSchema),
    defaultValues: item
      ? {
          school: item.school,
          degree: item.degree ?? "",
          field: item.field ?? "",
          start_date: item.start_date ?? "",
          end_date: item.end_date ?? "",
          grade: item.grade ?? "",
          description: item.description ?? "",
        }
      : EMPTY,
  });
  const { register, handleSubmit, formState, setError } = form;
  const e = formState.errors;

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({
        id: item?.id,
        body: {
          school: v.school,
          degree: v.degree,
          field: v.field || null,
          start_date: v.start_date,
          end_date: v.end_date || null,
          grade: v.grade || null,
          description: v.description || null,
        },
      });
      onDone();
    } catch (error) {
      applyApiErrors(error, setError, FIELDS);
    }
  });

  const input = (
    id: keyof EducationValues,
    label: string,
    opts: { type?: string; placeholder?: string; optional?: boolean } = {},
  ) => (
    <Field label={label} htmlFor={`ed-${id}`} error={e[id]?.message} optional={opts.optional}>
      <Input
        id={`ed-${id}`}
        type={opts.type ?? "text"}
        placeholder={opts.placeholder}
        aria-invalid={!!e[id] || undefined}
        aria-describedby={describedBy(`ed-${id}`)}
        className={inputClass}
        {...register(id)}
      />
    </Field>
  );

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">{input("school", "School", { placeholder: "Anna University" })}</div>
        {input("degree", "Degree", { placeholder: "B.E." })}
        {input("field", "Field of study", { placeholder: "Computer Science", optional: true })}
        {input("start_date", "Start date", { type: "date" })}
        {input("end_date", "End date", { type: "date", optional: true })}
        {input("grade", "Grade", { placeholder: "8.4 CGPA", optional: true })}
      </div>
      <Field label="Description" htmlFor="ed-description" error={e.description?.message} optional>
        <Textarea
          id="ed-description"
          rows={3}
          className={textareaClass}
          placeholder="Relevant coursework, projects, awards…"
          {...register("description")}
        />
      </Field>
      <FormActions saving={save.isPending} onCancel={onDone} label={item ? "Save changes" : "Add education"} />
    </form>
  );
};

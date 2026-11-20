"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Brain, Code2, Layers, Loader2, Plus, Puzzle, Trash2, Wrench, type LucideIcon } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyApiErrors } from "@/lib/api/form-errors";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { useSkillMutations } from "../hooks";
import { skillSchema, type SkillValues } from "../schemas";
import type { Skill, SkillCategory, SkillLevel } from "../types";
import { describedBy, Field, FormActions, inputClass, SectionCard, Segmented, SimpleSelect } from "./form-kit";
import { ResponsiveDialog } from "./ResponsiveDialog";

export const CATEGORIES: { value: SkillCategory; label: string; plural: string; icon: LucideIcon }[] = [
  { value: "language", label: "Language", plural: "Languages", icon: Code2 },
  { value: "framework", label: "Framework", plural: "Frameworks", icon: Layers },
  { value: "tool", label: "Tool", plural: "Tools", icon: Wrench },
  { value: "ml", label: "ML / AI", plural: "ML & AI", icon: Brain },
  { value: "other", label: "Other", plural: "Other", icon: Puzzle },
];

const LEVELS: { value: SkillLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];
const LEVEL_RANK: Record<SkillLevel, number> = { beginner: 1, intermediate: 2, advanced: 3 };

/** Three little bars, filled by level. */
export const LevelBars = ({ level, className }: { level: SkillLevel; className?: string }) => (
  <span aria-hidden className={cn("inline-flex items-end gap-[2px]", className)}>
    {[1, 2, 3].map((n) => (
      <span
        key={n}
        className={cn("w-[3px] rounded-full", n <= LEVEL_RANK[level] ? "bg-primary" : "bg-current opacity-20")}
        style={{ height: 4 + n * 3 }}
      />
    ))}
  </span>
);

const FIELDS = ["name", "level", "category"] as const;

export const SkillsTab = ({ skills }: { skills: Skill[] }) => {
  const [editing, setEditing] = useState<Skill | null>(null);
  const groups = CATEGORIES.map((c) => ({
    ...c,
    skills: skills
      .filter((s) => s.category === c.value)
      .sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || a.name.localeCompare(b.name)),
  })).filter((g) => g.skills.length);

  return (
    <div className="flex flex-col gap-5">
      <AddSkillCard existing={skills} />

      {skills.length === 0 ? (
        <EmptyState
          icon={Box}
          title="No skills yet"
          description="Add the languages, frameworks and tools you use. Mandy matches jobs to them."
        />
      ) : (
        <LayoutGroup>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false}>
              {groups.map((g) => (
                <motion.section
                  key={g.value}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: duration.base, ease: easeOut }}
                  className="rounded-xl border bg-card p-5 shadow-card"
                  aria-labelledby={`skills-${g.value}`}
                >
                  <header className="mb-4 flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-primary-soft text-primary-strong">
                      <g.icon className="size-4" aria-hidden />
                    </span>
                    <h3 id={`skills-${g.value}`} className="flex-1 font-semibold">
                      {g.plural}
                    </h3>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-xs text-muted-foreground tabular-nums">
                      {g.skills.length}
                    </span>
                  </header>
                  <ul className="flex flex-wrap gap-2">
                    <AnimatePresence initial={false}>
                      {g.skills.map((s) => (
                        <motion.li
                          key={s.id}
                          layoutId={`skill-${s.id}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: duration.base, ease: easeOut }}
                        >
                          <button
                            type="button"
                            onClick={() => setEditing(s)}
                            aria-label={`${s.name}, ${s.level}. Edit`}
                            className="inline-flex h-10 items-center gap-2 rounded-full border bg-surface-2/70 pr-3 pl-3.5 text-sm font-medium text-foreground transition-[border-color,background-color] hover:border-primary/40 hover:bg-primary-soft md:h-9"
                          >
                            {s.name}
                            <LevelBars level={s.level} className="text-muted-foreground" />
                          </button>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </motion.section>
              ))}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {LEVELS.map((l) => (
          <span key={l.value} className="inline-flex items-center gap-1.5">
            <LevelBars level={l.value} /> {l.label}
          </span>
        ))}
      </div>

      <ResponsiveDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title="Edit skill"
        description="Change the level or category."
      >
        {editing && <EditSkillForm key={editing.id} skill={editing} onDone={() => setEditing(null)} />}
      </ResponsiveDialog>
    </div>
  );
};

const AddSkillCard = ({ existing }: { existing: Skill[] }) => {
  const { save } = useSkillMutations();
  const form = useForm<SkillValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: "", level: "intermediate", category: "language" },
  });
  const { register, handleSubmit, control, formState, setError, reset, getValues } = form;
  const e = formState.errors;

  const onSubmit = handleSubmit(async (v) => {
    if (existing.some((s) => s.name.toLowerCase() === v.name.trim().toLowerCase())) {
      setError("name", { message: `${v.name} is already on your list` });
      return;
    }
    try {
      await save.mutateAsync({ body: v });
      reset({ name: "", level: getValues("level"), category: getValues("category") });
    } catch (error) {
      applyApiErrors(error, setError, FIELDS);
    }
  });

  return (
    <SectionCard
      title="Add a skill"
      description="Pick a level honestly: it helps Mandy suggest what to learn next."
      icon={<Plus />}
    >
      <form
        noValidate
        onSubmit={onSubmit}
        className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto_auto] lg:items-end"
      >
        <Field label="Skill" htmlFor="sk-name" error={e.name?.message}>
          <Input
            id="sk-name"
            placeholder="TypeScript, PyTorch, Docker…"
            autoComplete="off"
            aria-invalid={!!e.name || undefined}
            aria-describedby={describedBy("sk-name")}
            className={inputClass}
            {...register("name")}
          />
        </Field>
        <Field label="Category" htmlFor="sk-category">
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <SimpleSelect id="sk-category" value={field.value} onChange={field.onChange} options={CATEGORIES} />
            )}
          />
        </Field>
        <Field label="Level">
          <Controller
            control={control}
            name="level"
            render={({ field }) => (
              <Segmented
                label="Level"
                value={field.value}
                onChange={field.onChange}
                options={LEVELS}
                className="w-full lg:w-auto"
              />
            )}
          />
        </Field>
        <Button type="submit" className={cn("h-11 px-5 md:h-10", e.name && "lg:mb-[22px]")} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          Add
        </Button>
      </form>
    </SectionCard>
  );
};

const EditSkillForm = ({ skill, onDone }: { skill: Skill; onDone: () => void }) => {
  const { save, remove } = useSkillMutations();
  const [confirm, setConfirm] = useState(false);
  const form = useForm<SkillValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: skill.name, level: skill.level, category: skill.category },
  });
  const { register, handleSubmit, control, formState, setError } = form;
  const e = formState.errors;

  const onSubmit = handleSubmit(async (v) => {
    try {
      await save.mutateAsync({ id: skill.id, body: v });
      onDone();
    } catch (error) {
      applyApiErrors(error, setError, FIELDS);
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Skill" htmlFor="sk-edit-name" error={e.name?.message}>
        <Input
          id="sk-edit-name"
          className={inputClass}
          aria-invalid={!!e.name || undefined}
          aria-describedby={describedBy("sk-edit-name")}
          {...register("name")}
        />
      </Field>
      <Field label="Category" htmlFor="sk-edit-category">
        <Controller
          control={control}
          name="category"
          render={({ field }) => (
            <SimpleSelect id="sk-edit-category" value={field.value} onChange={field.onChange} options={CATEGORIES} />
          )}
        />
      </Field>
      <Field label="Level">
        <Controller
          control={control}
          name="level"
          render={({ field }) => (
            <Segmented label="Level" value={field.value} onChange={field.onChange} options={LEVELS} className="w-full" />
          )}
        />
      </Field>
      <Button type="button" variant="destructive" className="h-11 w-full md:h-10 md:w-fit" onClick={() => setConfirm(true)}>
        <Trash2 data-icon="inline-start" /> Delete skill
      </Button>
      <FormActions saving={save.isPending} onCancel={onDone} label="Save skill" />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Delete ${skill.name}?`}
        description="It will be removed from your profile. Existing resumes keep their copy."
        onConfirm={() => {
          remove.mutate(skill.id);
          onDone();
        }}
      />
    </form>
  );
};

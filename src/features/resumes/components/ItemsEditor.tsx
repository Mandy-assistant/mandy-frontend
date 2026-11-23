"use client";

import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { inputClass, TagInput, textareaClass } from "@/features/profile/components/form-kit";
import { monthYear } from "@/features/profile/format";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { emptyItem } from "../content";
import type { SectionItem, SectionType } from "../types";
import { AiAssist } from "./AiAssist";

type Labels = {
  title: string;
  subtitle?: string;
  location?: string;
  dates: boolean;
  url?: boolean;
  bullets: boolean;
  tags?: string;
  description: boolean;
  add: string;
};

const LABELS: Record<Exclude<SectionType, "summary">, Labels> = {
  experience: {
    title: "Role",
    subtitle: "Company",
    location: "Location",
    dates: true,
    bullets: true,
    description: true,
    add: "Add role",
  },
  education: {
    title: "Degree",
    subtitle: "School",
    location: "Grade or location",
    dates: true,
    bullets: false,
    description: true,
    add: "Add education",
  },
  projects: {
    title: "Project",
    subtitle: "One-line description",
    url: true,
    dates: false,
    bullets: true,
    tags: "Tech used",
    description: true,
    add: "Add project",
  },
  skills: { title: "Group", dates: false, bullets: false, tags: "Skills", description: false, add: "Add skill group" },
};

const PLACEHOLDER: Partial<Record<SectionType, { title: string; subtitle?: string }>> = {
  experience: { title: "Frontend Developer", subtitle: "Acme Corp" },
  education: { title: "B.E., Computer Science", subtitle: "Anna University" },
  projects: { title: "Mandy", subtitle: "Personal career assistant" },
  skills: { title: "Languages" },
};

export const ItemsEditor = ({
  type,
  items,
  onChange,
}: {
  type: SectionType;
  items: SectionItem[];
  onChange: (items: SectionItem[]) => void;
}) => {
  const labels = LABELS[type as Exclude<SectionType, "summary">];
  const [openId, setOpenId] = useState<string | null>(items.length === 1 ? items[0].id : null);

  const patch = (id: string, p: Partial<SectionItem>) => onChange(items.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const add = () => {
    const item = emptyItem();
    onChange([...items, item]);
    setOpenId(item.id);
  };
  const remove = (item: SectionItem) => {
    const index = items.indexOf(item);
    onChange(items.filter((it) => it.id !== item.id));
    toast.success(`Removed ${item.title || "item"}`, {
      action: { label: "Undo", onClick: () => onChange([...items.slice(0, index), item, ...items.slice(index)]) },
    });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {items.map((item) => {
            const open = openId === item.id;
            const summary =
              type === "skills"
                ? (item.tags ?? []).join(", ")
                : [item.subtitle, [monthYear(item.start_date), monthYear(item.end_date)].filter(Boolean).join(" – ")]
                    .filter(Boolean)
                    .join(" · ");
            return (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: duration.base, ease: easeOut }}
                className={cn("rounded-2xl border bg-surface-2/40 transition-colors", open && "border-primary/30 bg-surface")}
              >
                <div className="flex items-center gap-1 p-1.5 pl-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-expanded={open}
                    className="flex min-h-11 min-w-0 flex-1 flex-col justify-center text-left md:min-h-10"
                  >
                    <span className="truncate text-sm font-medium">
                      {item.title || <span className="text-muted-foreground">Untitled</span>}
                    </span>
                    {summary && <span className="truncate text-xs text-muted-foreground">{summary}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    aria-label={`Remove ${item.title || "item"}`}
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-destructive-soft hover:text-destructive md:size-9"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : item.id)}
                    aria-label={open ? "Collapse" : "Expand"}
                    className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-surface-2 md:size-9"
                  >
                    <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden />
                  </button>
                </div>
                {open && <ItemFields type={type} item={item} labels={labels} onPatch={(p) => patch(item.id, p)} />}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <Button type="button" variant="outline" onClick={add} className="h-11 rounded-2xl border-dashed md:h-10">
        <Plus data-icon="inline-start" /> {labels.add}
      </Button>
    </div>
  );
};

const L = ({ children, htmlFor }: { children: string; htmlFor: string }) => (
  <label htmlFor={htmlFor} className="text-[13px] font-medium text-foreground/85">
    {children}
  </label>
);

const ItemFields = ({
  type,
  item,
  labels,
  onPatch,
}: {
  type: SectionType;
  item: SectionItem;
  labels: Labels;
  onPatch: (p: Partial<SectionItem>) => void;
}) => {
  const id = (f: string) => `it-${item.id}-${f}`;
  const ph = PLACEHOLDER[type];
  const bullets = item.bullets ?? [];
  const text = (field: keyof SectionItem, label: string, placeholder?: string, className?: string) => (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <L htmlFor={id(field)}>{label}</L>
      <Input
        id={id(field)}
        value={(item[field] as string | null | undefined) ?? ""}
        placeholder={placeholder}
        onChange={(e) => onPatch({ [field]: e.target.value })}
        className={inputClass}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 border-t px-3.5 pt-4 pb-4">
      <div className="grid gap-3.5 sm:grid-cols-2">
        {text("title", labels.title, ph?.title, labels.subtitle ? undefined : "sm:col-span-2")}
        {labels.subtitle && text("subtitle", labels.subtitle, ph?.subtitle)}
        {labels.location &&
          text(
            "location",
            labels.location,
            type === "education" ? "8.4 CGPA" : "Remote",
            labels.dates ? "sm:col-span-2" : undefined,
          )}
        {labels.dates && text("start_date", "Start", "Jun 2023")}
        {labels.dates && text("end_date", "End", "Present")}
        {labels.url && text("url", "Link", "https://github.com/you/project", "sm:col-span-2")}
      </div>

      {labels.tags && (
        <div className="flex flex-col gap-1.5">
          <L htmlFor={id("tags")}>{labels.tags}</L>
          <TagInput
            id={id("tags")}
            value={item.tags ?? []}
            onChange={(tags) => onPatch({ tags })}
            placeholder="Type and press Enter"
            max={30}
          />
        </div>
      )}

      {labels.description && (
        <div className="flex flex-col gap-1.5">
          <L htmlFor={id("description")}>Description</L>
          <div className="flex flex-wrap justify-end gap-2">
            <Textarea
              id={id("description")}
              value={item.description ?? ""}
              onChange={(e) => onPatch({ description: e.target.value })}
              rows={3}
              placeholder="What it is and what you did."
              className={cn(textareaClass, "min-h-20 basis-full")}
            />
            <AiAssist text={item.description ?? ""} kind="bullet" onAccept={(description) => onPatch({ description })} />
          </div>
        </div>
      )}

      {labels.bullets && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground/85">Highlights</legend>
          <AnimatePresence initial={false}>
            {bullets.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.fast }}
                className="flex flex-wrap items-start gap-1.5"
              >
                <span aria-hidden className="mt-[18px] size-1.5 shrink-0 rounded-full bg-brand-gradient md:mt-4" />
                <Textarea
                  value={b}
                  aria-label={`Highlight ${i + 1}`}
                  rows={1}
                  onChange={(e) => onPatch({ bullets: bullets.map((x, j) => (j === i ? e.target.value : x)) })}
                  placeholder="Started with a verb, ended with a number"
                  className={cn(textareaClass, "[field-sizing:content] min-h-11 min-w-0 flex-1 resize-none py-2.5 md:min-h-10")}
                />
                <AiAssist
                  compact
                  text={b}
                  kind="bullet"
                  label={`Improve highlight ${i + 1} with AI`}
                  onAccept={(t) => onPatch({ bullets: bullets.map((x, j) => (j === i ? t : x)) })}
                />
                <button
                  type="button"
                  onClick={() => onPatch({ bullets: bullets.filter((_, j) => j !== i) })}
                  aria-label={`Remove highlight ${i + 1}`}
                  className="grid size-10 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive-soft hover:text-destructive md:size-9"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 w-fit rounded-xl text-primary-strong"
            onClick={() => onPatch({ bullets: [...bullets, ""] })}
          >
            <Plus data-icon="inline-start" /> Add highlight
          </Button>
        </fieldset>
      )}
    </div>
  );
};

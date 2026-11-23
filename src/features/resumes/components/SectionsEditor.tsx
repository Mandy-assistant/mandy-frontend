"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  Eye,
  EyeOff,
  FolderGit2,
  GraduationCap,
  GripVertical,
  TextQuote,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { inputClass, textareaClass } from "@/features/profile/components/form-kit";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import type { Section, SectionType } from "../types";
import { AiAssist } from "./AiAssist";
import { ItemsEditor } from "./ItemsEditor";

export const SECTION_ICON: Record<SectionType, LucideIcon> = {
  summary: TextQuote,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  projects: FolderGit2,
};

type Props = {
  sections: Section[];
  onReorder: (sections: Section[]) => void;
  onChange: (id: string, patch: Partial<Section>) => void;
};

export const SectionsEditor = ({ sections, onReorder, onChange }: Props) => {
  const [open, setOpen] = useState<Set<string>>(() => new Set(sections.slice(0, 1).map((s) => s.id)));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const titleOf = (id: string | number) => sections.find((s) => s.id === id)?.title ?? "Section";
  const position = (id: string | number) => sections.findIndex((s) => s.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${titleOf(active.id)}. Position ${position(active.id)} of ${sections.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${titleOf(active.id)} moved to position ${position(over.id)} of ${sections.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${titleOf(active.id)} dropped at position ${position(over.id)}.` : `${titleOf(active.id)} dropped.`,
    onDragCancel: ({ active }) => `Reordering cancelled. ${titleOf(active.id)} returned to its place.`,
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.id === active.id);
    const to = sections.findIndex((s) => s.id === over.id);
    onReorder(arrayMove(sections, from, to));
  };

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <DndContext
      id="resume-sections"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To reorder, press Space or Enter on the handle, use the arrow keys to move, then Space or Enter to drop. Escape cancels.",
        },
      }}
    >
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-3" aria-label="Resume sections">
          {sections.map((s) => (
            <SortableSection
              key={s.id}
              section={s}
              open={open.has(s.id)}
              onToggle={() => toggle(s.id)}
              onChange={(patch) => onChange(s.id, patch)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
};

const SortableSection = ({
  section,
  open,
  onToggle,
  onChange,
}: {
  section: Section;
  open: boolean;
  onToggle: () => void;
  onChange: (p: Partial<Section>) => void;
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const reduced = useReducedMotion();
  const Icon = SECTION_ICON[section.type] ?? BookOpen;
  const count = section.type === "summary" ? (section.text?.trim() ? 1 : 0) : section.items.length;
  const bodyId = `sec-body-${section.id}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative rounded-xl border bg-card shadow-card transition-[box-shadow,opacity]",
        isDragging && "z-20 shadow-pop ring-2 ring-primary/40",
        !section.visible && "bg-surface-2/40",
      )}
    >
      <div className="flex items-center gap-1 p-2">
        <button
          ref={setActivatorNodeRef}
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${section.title}`}
          className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground active:cursor-grabbing md:size-9"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 text-left transition-colors hover:bg-surface-2/60 md:min-h-10"
        >
          <span
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-lg",
              section.visible ? "bg-primary-soft text-primary-strong" : "bg-surface-2 text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-semibold",
              !section.visible && "text-muted-foreground line-through decoration-1",
            )}
          >
            {section.title}
          </span>
          {count > 0 && section.type !== "summary" && (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
            aria-hidden
          />
        </button>
        <button
          type="button"
          aria-pressed={!section.visible}
          aria-label={section.visible ? `Hide ${section.title} from resume` : `Show ${section.title} on resume`}
          title={section.visible ? "Hide from resume" : "Show on resume"}
          onClick={() => onChange({ visible: !section.visible })}
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl transition-colors md:size-9",
            section.visible ? "text-muted-foreground hover:bg-surface-2 hover:text-foreground" : "bg-warning-soft text-warning",
          )}
        >
          {section.visible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={bodyId}
            initial={{ opacity: 0, height: reduced ? "auto" : 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: reduced ? "auto" : 0 }}
            transition={{ duration: duration.base, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t px-4 pt-4 pb-5 sm:px-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-[13px] font-medium text-foreground/85">Section title</span>
                <Input value={section.title} onChange={(e) => onChange({ title: e.target.value })} className={inputClass} />
              </label>
              {section.type === "summary" ? (
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`sum-${section.id}`} className="text-[13px] font-medium text-foreground/85">
                    Summary
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Textarea
                      id={`sum-${section.id}`}
                      value={section.text ?? ""}
                      onChange={(e) => onChange({ text: e.target.value })}
                      rows={5}
                      placeholder="Two or three lines: who you are, what you're great at, what you want next."
                      className={cn(textareaClass, "basis-full")}
                    />
                    <AiAssist text={section.text ?? ""} kind="summary" onAccept={(text) => onChange({ text })} />
                  </div>
                </div>
              ) : (
                <ItemsEditor type={section.type} items={section.items} onChange={(items) => onChange({ items })} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

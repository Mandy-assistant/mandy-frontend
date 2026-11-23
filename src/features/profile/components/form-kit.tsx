"use client";

import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";

/** Bigger, rounder inputs than the primitive default: 44px touch targets on phones. */
export const inputClass = "h-11 rounded-xl bg-surface px-3.5 text-[15px] md:h-10 md:text-sm dark:bg-surface-2";
export const textareaClass =
  "min-h-28 rounded-xl bg-surface px-3.5 py-2.5 text-[15px] leading-relaxed md:text-sm dark:bg-surface-2";

type FieldProps = {
  label: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

/** Label + control + error/hint. Give the control `aria-describedby={describedBy(id)}`. */
export const Field = ({ label, htmlFor, error, hint, optional, className, children }: FieldProps) => (
  <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
    <Label htmlFor={htmlFor} className="justify-between text-[13px] text-foreground/85">
      <span>{label}</span>
      {optional && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
    </Label>
    {children}
    {error ? (
      <p id={htmlFor && `${htmlFor}-msg`} role="alert" className="text-xs font-medium text-destructive">
        {error}
      </p>
    ) : hint ? (
      <p id={htmlFor && `${htmlFor}-msg`} className="text-xs text-muted-foreground">
        {hint}
      </p>
    ) : null}
  </div>
);

export const describedBy = (id: string) => `${id}-msg`;

/** Card used for form groups on the profile and settings pages. */
export const SectionCard = ({
  title,
  description,
  icon,
  action,
  children,
  className,
  id,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
}) => (
  <section id={id} className={cn("min-w-0 scroll-mt-24 rounded-xl border bg-card p-5 shadow-card sm:p-6", className)}>
    <header className={cn("flex flex-wrap items-start justify-between gap-3", children != null && "mb-5")}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary-strong [&_svg]:size-[18px]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </header>
    {children}
  </section>
);

/** Segmented control (prototype `.seg`). */
export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  label,
  className,
  size = "default",
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: ReactNode; icon?: ReactNode }[];
  label: string;
  className?: string;
  size?: "sm" | "default";
}) => (
  <div
    role="radiogroup"
    aria-label={label}
    className={cn("inline-flex max-w-full flex-wrap gap-1 rounded-[14px] bg-surface-2 p-1", className)}
  >
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        onClick={() => onChange(o.value)}
        className={cn(
          "inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] px-3 font-medium whitespace-nowrap text-muted-foreground transition-[background-color,color,box-shadow] duration-150 hover:text-foreground aria-checked:bg-surface aria-checked:text-foreground aria-checked:shadow-card dark:aria-checked:bg-surface-hover [&_svg]:size-4",
          size === "sm" ? "h-8 text-[13px]" : "h-10 text-sm md:h-9",
        )}
      >
        {o.icon}
        {o.label}
      </button>
    ))}
  </div>
);

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  max?: number;
  invalid?: boolean;
  "aria-describedby"?: string;
  suggestions?: readonly string[];
};

/** Multi-tag input: Enter or comma adds, Backspace on empty removes the last tag. */
export const TagInput = ({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
  max = 20,
  invalid,
  suggestions,
  ...aria
}: TagInputProps) => {
  const [draft, setDraft] = useState("");
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, "").trim();
    if (!tag || value.length >= max) return;
    if (value.some((v) => v.toLowerCase() === tag.toLowerCase())) return setDraft("");
    onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = suggestions?.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase())).slice(0, 6) ?? [];

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-surface p-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:min-h-10 dark:bg-surface-2",
          invalid && "border-destructive ring-3 ring-destructive/20",
        )}
      >
        <ul className="contents" aria-label="Added">
          <AnimatePresence initial={false}>
            {value.map((tag) => (
              <motion.li
                key={tag}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: duration.fast, ease: easeOut }}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-primary-soft py-0.5 pr-1 pl-3 text-[13px] font-medium text-primary-strong"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== tag))}
                  aria-label={`Remove ${tag}`}
                  className="grid size-6 place-items-center rounded-full transition-colors hover:bg-primary/15"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <input
          id={inputId}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
          placeholder={value.length >= max ? `Limit of ${max} reached` : placeholder}
          disabled={value.length >= max}
          aria-invalid={invalid || undefined}
          aria-describedby={aria["aria-describedby"]}
          className="h-8 min-w-32 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-muted-foreground md:text-sm"
        />
      </div>
      {remaining.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Suggestions:</span>
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="h-7 rounded-full border border-dashed px-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary-strong"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/** Sticky Cancel / Submit row at the bottom of a ResponsiveDialog body. */
export const FormActions = ({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) => (
  <div className="sticky -bottom-4 z-10 -mx-5 mt-2 flex gap-2 border-t bg-popover px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] *:max-md:flex-1 md:-bottom-5 md:-mx-6 md:justify-end md:px-6 md:pb-3">
    <Button type="button" variant="outline" className="h-11 md:h-10" onClick={onCancel}>
      Cancel
    </Button>
    <Button type="submit" className="h-11 px-5 md:h-10" disabled={saving}>
      {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
      {label}
    </Button>
  </div>
);

/** Select with a fixed option list; shows the label (not the raw value) in the trigger. */
export const SimpleSelect = <T extends string>({
  id,
  value,
  onChange,
  options,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
  className?: string;
  "aria-label"?: string;
}) => (
  <Select items={options} value={value} onValueChange={(v) => v != null && onChange(v as T)}>
    <SelectTrigger
      id={id}
      aria-label={ariaLabel}
      className={cn("h-11! w-full rounded-xl bg-surface px-3.5 text-[15px] md:h-10! md:text-sm dark:bg-surface-2", className)}
    >
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {options.map((o) => (
        <SelectItem key={o.value} value={o.value} className="min-h-10 md:min-h-8">
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

"use client";

import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { cn } from "@/utils/cn";

type TagInputProps = {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  invalid?: boolean;
  placeholder?: string;
  "aria-describedby"?: string;
};

/** Chips + input. Enter or comma adds a tag, Backspace on an empty input removes the last one. */
export const TagInput = ({ id, value, onChange, max = 10, invalid, placeholder = "Add a tag…", ...aria }: TagInputProps) => {
  const [draft, setDraft] = useState("");

  const commit = (raw = draft) => {
    const tag = raw.trim().replace(/,+$/, "").slice(0, 30);
    setDraft("");
    if (!tag || value.length >= max || value.some((t) => t.toLowerCase() === tag.toLowerCase())) return;
    onChange([...value, tag]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-1.5 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30",
        invalid && "border-destructive ring-3 ring-destructive/20",
      )}
    >
      {value.map((tag) => (
        <span key={tag} className="inline-flex h-6 items-center gap-1 rounded-md bg-primary-soft pr-0.5 pl-2 text-xs font-medium text-primary-strong">
          {tag}
          <button
            type="button"
            onClick={() => onChange(value.filter((t) => t !== tag))}
            aria-label={`Remove tag ${tag}`}
            className="grid size-5 place-items-center rounded-sm outline-none hover:bg-primary/15 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) commit(v);
          else setDraft(v);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => commit()}
        disabled={value.length >= max}
        placeholder={value.length >= max ? `Up to ${max} tags` : value.length ? "" : placeholder}
        aria-invalid={invalid || undefined}
        className="h-7 min-w-24 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-muted-foreground md:text-sm"
        {...aria}
      />
    </div>
  );
};

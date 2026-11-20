"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import type { TaskPriority } from "../types";
import { PRIORITIES } from "../utils";

const items = Object.fromEntries(PRIORITIES.map((p) => [p.value, p.label]));

type PrioritySelectProps = {
  id?: string;
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  className?: string;
  "aria-label"?: string;
};

export const PrioritySelect = ({ id, value, onChange, className, ...rest }: PrioritySelectProps) => (
  <Select items={items} value={value} onValueChange={(v) => v && onChange(v as TaskPriority)}>
    <SelectTrigger id={id} aria-label={rest["aria-label"]} className={cn("h-11 sm:h-9", className)}>
      <i className={cn("size-2 shrink-0 rounded-full", PRIORITIES.find((p) => p.value === value)?.dot)} aria-hidden />
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {PRIORITIES.map((p) => (
        <SelectItem key={p.value} value={p.value}>
          <i className={cn("size-2 shrink-0 rounded-full", p.dot)} aria-hidden />
          {p.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

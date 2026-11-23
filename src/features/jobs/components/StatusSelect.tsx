"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import { STATUS_META } from "../status";
import { JOB_STATUSES, isJobStatus, type JobStatus } from "../types";
import { StatusDot } from "./bits";

const items = JOB_STATUSES.map((s) => ({ value: s, label: STATUS_META[s].label }));

type StatusSelectProps = {
  value: JobStatus;
  onChange: (status: JobStatus) => void;
  label: string;
  className?: string;
  id?: string;
  size?: "sm" | "default";
};

/** Status picker with coloured dots (cards on mobile, the job form). */
export const StatusSelect = ({ value, onChange, label, className, id, size = "default" }: StatusSelectProps) => (
  <Select items={items} value={value} onValueChange={(v) => isJobStatus(v) && onChange(v)}>
    <SelectTrigger id={id} size={size} aria-label={label} className={cn("min-w-32", className)}>
      <SelectValue>
        {(v: JobStatus) => (
          <>
            <StatusDot status={v} />
            {STATUS_META[v].label}
          </>
        )}
      </SelectValue>
    </SelectTrigger>
    <SelectContent>
      {JOB_STATUSES.map((s) => (
        <SelectItem key={s} value={s}>
          <StatusDot status={s} />
          {STATUS_META[s].label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

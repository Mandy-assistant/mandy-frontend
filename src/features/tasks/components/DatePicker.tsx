"use client";

import { addDays, format, parseISO } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { localISODate } from "../utils";

type DatePickerProps = {
  id?: string;
  /** YYYY-MM-DD or null */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Show Today / Tomorrow / Next week shortcuts. */
  shortcuts?: boolean;
  className?: string;
  "aria-invalid"?: boolean;
};

/** Calendar in a popover, storing plain dates (YYYY-MM-DD). */
export const DatePicker = ({ id, value, onChange, placeholder = "No date", shortcuts = true, className, ...rest }: DatePickerProps) => {
  const [open, setOpen] = useState(false);
  const selected = value ? parseISO(value) : undefined;
  const pick = (date: string | null) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              aria-invalid={rest["aria-invalid"]}
              className={cn("h-11 flex-1 justify-start font-normal sm:h-9", !value && "text-muted-foreground")}
            />
          }
        >
          <CalendarDays data-icon="inline-start" className="text-muted-foreground" />
          {selected ? format(selected, "EEE, MMM d, yyyy") : placeholder}
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          {shortcuts && (
            <div className="flex gap-1.5 px-1 pt-1">
              {[
                ["Today", 0],
                ["Tomorrow", 1],
                ["Next week", 7],
              ].map(([label, days]) => (
                <Button key={label} type="button" size="xs" variant="secondary" onClick={() => pick(localISODate(addDays(new Date(), days as number)))}>
                  {label}
                </Button>
              ))}
            </div>
          )}
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => pick(date ? localISODate(date) : null)}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {value && (
        <Button type="button" variant="ghost" size="icon" className="size-11 sm:size-9" aria-label="Clear date" onClick={() => onChange(null)}>
          <X />
        </Button>
      )}
    </div>
  );
};

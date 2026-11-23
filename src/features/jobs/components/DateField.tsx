"use client";

import { format, isValid, parseISO } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";

type DateFieldProps = {
  id?: string;
  /** YYYY-MM-DD or "" */
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  placeholder?: string;
  "aria-describedby"?: string;
};

/** Date picker button (Calendar in a Popover) that stores YYYY-MM-DD. */
export const DateField = ({ id, value, onChange, invalid, placeholder = "Pick a date", ...aria }: DateFieldProps) => {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              aria-invalid={invalid || undefined}
              className={cn("h-9 w-full justify-start bg-transparent px-2.5 font-normal max-md:h-11", !date && "text-muted-foreground", date && "pr-9")}
              {...aria}
            />
          }
        >
          <CalendarDays data-icon="inline-start" className="text-muted-foreground" />
          {date ? format(date, "EEE, MMM d, yyyy") : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(d) => {
              onChange(d ? format(d, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {date && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear date"
          className="absolute top-1/2 right-1.5 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
};

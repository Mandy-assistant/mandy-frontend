"use client";

import { ChevronDown, IdCard, Plus, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inputClass } from "@/features/profile/components/form-kit";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import type { ResumeHeader } from "../types";

const FIELDS: { key: Exclude<keyof ResumeHeader, "links">; label: string; placeholder: string; type?: string; wide?: boolean }[] =
  [
    { key: "full_name", label: "Full name", placeholder: "Mathan Kumar" },
    { key: "headline", label: "Headline", placeholder: "Frontend Developer" },
    { key: "email", label: "Email", placeholder: "you@example.com", type: "email" },
    { key: "phone", label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
    { key: "location", label: "Location", placeholder: "Chennai, India", wide: true },
  ];

export const HeaderEditor = ({ header, onChange }: { header: ResumeHeader; onChange: (h: ResumeHeader) => void }) => {
  const [open, setOpen] = useState(true);
  const reduced = useReducedMotion();
  const set = (patch: Partial<ResumeHeader>) => onChange({ ...header, ...patch });
  const links = header.links ?? [];

  return (
    <section className="rounded-xl border bg-card shadow-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="resume-header-body"
        className="flex min-h-15 w-full items-center gap-3 rounded-xl p-2 pl-3 text-left"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient text-white">
          <IdCard className="size-4" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-semibold">Header</span>
          <span className="block text-xs text-muted-foreground">Name, contact details and links. Always shown.</span>
        </span>
        <ChevronDown
          className={cn("mr-2 size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="resume-header-body"
            initial={{ opacity: 0, height: reduced ? "auto" : 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: reduced ? "auto" : 0 }}
            transition={{ duration: duration.base, ease: easeOut }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 border-t px-4 pt-4 pb-5 sm:px-5">
              <div className="grid gap-3.5 sm:grid-cols-2">
                {FIELDS.map((f) => (
                  <label key={f.key} className={cn("flex flex-col gap-1.5", f.wide && "sm:col-span-2")}>
                    <span className="text-[13px] font-medium text-foreground/85">{f.label}</span>
                    <Input
                      type={f.type ?? "text"}
                      value={header[f.key] ?? ""}
                      placeholder={f.placeholder}
                      onChange={(e) => set({ [f.key]: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                ))}
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-1.5 text-[13px] font-medium text-foreground/85">Links</legend>
                {links.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      aria-label={`Link ${i + 1} label`}
                      value={l.label}
                      placeholder="GitHub"
                      onChange={(e) => set({ links: links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                      className={cn(inputClass, "w-28 shrink-0 sm:w-36")}
                    />
                    <Input
                      aria-label={`Link ${i + 1} URL`}
                      type="url"
                      value={l.url}
                      placeholder="https://github.com/you"
                      onChange={(e) => set({ links: links.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })}
                      className={cn(inputClass, "min-w-0 flex-1")}
                    />
                    <button
                      type="button"
                      onClick={() => set({ links: links.filter((_, j) => j !== i) })}
                      aria-label={`Remove link ${l.label || i + 1}`}
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-destructive-soft hover:text-destructive md:size-10"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-fit rounded-xl text-primary-strong"
                  onClick={() => set({ links: [...links, { label: "", url: "" }] })}
                >
                  <Plus data-icon="inline-start" /> Add link
                </Button>
              </fieldset>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

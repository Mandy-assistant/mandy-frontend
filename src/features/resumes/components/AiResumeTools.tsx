"use client";

import { Loader2, RotateCcw, Wand2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Segmented } from "@/features/profile/components/form-kit";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/utils/cn";
import { useReviseResume } from "../hooks";
import type { Resume, ResumeStyle } from "../types";

const REVISE_IDEAS = [
  "Make it fit one page",
  "Tailor it to a backend role",
  "Stronger, quantified bullets",
  "Switch to classic serif, navy",
];

/** "Ask AI to change this resume": the change is saved as a new version you can restore from. */
export const AiReviseBar = ({
  resumeId,
  beforeRevise,
  onRevised,
}: {
  resumeId: string;
  beforeRevise: () => Promise<unknown>;
  onRevised: (r: Resume) => void;
}) => {
  const revise = useReviseResume(resumeId);
  const [prompt, setPrompt] = useState("");
  const [jd, setJd] = useState("");
  const [showJd, setShowJd] = useState(false);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = prompt.trim();
    if (text.length < 3) return;
    try {
      await beforeRevise();
      const { resume, notes } = await revise.mutateAsync({ prompt: text, job_description: jd.trim() || undefined });
      onRevised(resume);
      setPrompt("");
      toast.success("Resume updated", {
        description: notes || "Saved as a new version. Use History to go back.",
        duration: 8000,
      });
    } catch (error) {
      toast.error("Couldn't change the resume", { description: errorMessage(error) });
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-xl border bg-linear-to-br from-primary-soft/70 to-card p-3 shadow-card sm:p-4"
      aria-label="Ask AI to change this resume"
    >
      <div className="flex items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
          <Wand2 className="size-4" aria-hidden />
        </span>
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={4000}
          placeholder="Tell the AI what to change: layout, look, emphasis, length…"
          aria-label="What should the AI change?"
          disabled={revise.isPending}
          className="h-11 min-w-0 flex-1 rounded-xl border bg-surface px-3 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft md:h-10 md:text-sm"
        />
        <Button type="submit" disabled={revise.isPending || prompt.trim().length < 3} className="h-11 rounded-xl md:h-10">
          {revise.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : null}
          {revise.isPending ? "Working…" : "Apply"}
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {REVISE_IDEAS.map((idea) => (
          <button
            key={idea}
            type="button"
            onClick={() => setPrompt(idea)}
            className="rounded-full border bg-surface px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            {idea}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setShowJd((v) => !v)}
          className="ml-auto text-xs font-medium text-primary-strong hover:underline"
        >
          {showJd ? "Hide job post" : "+ Job post"}
        </button>
      </div>
      {showJd && (
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={4}
          maxLength={12000}
          placeholder="Paste the job description to tailor to"
          aria-label="Job description"
          className="rounded-xl border bg-surface px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft"
        />
      )}
    </form>
  );
};

const ACCENTS = ["#7c3aed", "#2563eb", "#0f766e", "#1e3a8a", "#be123c", "#c2410c", "#111827", "#15803d"];
export const DEFAULT_STYLE: ResumeStyle = { accent: "#7c3aed", font: "sans", density: "comfortable" };

/** Accent colour, font and spacing for the page. */
export const StylePopover = ({
  style,
  onChange,
}: {
  style: ResumeStyle | null | undefined;
  onChange: (s: ResumeStyle | null) => void;
}) => {
  const current = style ?? DEFAULT_STYLE;
  const set = (patch: Partial<ResumeStyle>) => onChange({ ...current, ...patch });
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" className="h-10 rounded-xl md:h-9" />}>
        <span aria-hidden className="size-3.5 rounded-full ring-2 ring-background" style={{ background: current.accent }} />
        <span className="max-sm:sr-only">Look</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-72 flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium">Accent</p>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ accent: c })}
                aria-label={`Accent ${c}`}
                aria-pressed={current.accent.toLowerCase() === c}
                className={cn(
                  "size-7 rounded-full ring-offset-2 ring-offset-popover transition-shadow",
                  current.accent.toLowerCase() === c && "ring-2 ring-foreground",
                )}
                style={{ background: c }}
              />
            ))}
            <label className="relative grid size-7 cursor-pointer place-items-center overflow-hidden rounded-full border text-[10px] font-bold">
              <span className="sr-only">Custom accent</span>+
              <input
                type="color"
                value={current.accent}
                onChange={(e) => set({ accent: e.target.value })}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium">Font</p>
          <Segmented
            label="Font"
            size="sm"
            value={current.font}
            onChange={(font) => set({ font })}
            options={[
              { value: "sans", label: "Sans" },
              { value: "serif", label: "Serif" },
              { value: "mono", label: "Mono" },
            ]}
          />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium">Spacing</p>
          <Segmented
            label="Spacing"
            size="sm"
            value={current.density}
            onChange={(density) => set({ density })}
            options={[
              { value: "comfortable", label: "Comfortable" },
              { value: "compact", label: "Compact" },
            ]}
          />
        </div>
        {style && (
          <Button variant="ghost" size="sm" onClick={() => onChange(null)} className="self-start">
            <RotateCcw data-icon="inline-start" /> Template default
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

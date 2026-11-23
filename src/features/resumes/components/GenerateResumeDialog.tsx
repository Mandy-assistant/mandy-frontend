"use client";

import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveDialog } from "@/features/profile/components/ResponsiveDialog";
import { errorMessage } from "@/lib/api/errors";
import { useGenerateResume } from "../hooks";

export const PROMPT_IDEAS = [
  "One page, modern, teal accent. Lead with my backend and API work, keep skills short.",
  "Classic serif, navy, compact. Tailor it to the job post below and put matching skills first.",
  "Fresher resume: education and projects first, a 2-line summary, clean sans, purple accent.",
  "ML engineer focus: highlight Python, models and data work. Monospace headings, comfortable spacing.",
];

/** Describe the resume you want; Gemini picks the template and look and writes it from your profile. */
export const GenerateResumeDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) => (
  <ResponsiveDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Create a resume with AI"
    description="Say how it should look and what to emphasise. Facts come only from your profile."
  >
    {open && <GenerateForm onDone={() => onOpenChange(false)} />}
  </ResponsiveDialog>
);

const GenerateForm = ({ onDone }: { onDone: () => void }) => {
  const router = useRouter();
  const generate = useGenerateResume();
  const [prompt, setPrompt] = useState("");
  const [jd, setJd] = useState("");
  const [title, setTitle] = useState("");
  const [showJd, setShowJd] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim().length < 3) return;
    try {
      const { resume, notes } = await generate.mutateAsync({
        prompt: prompt.trim(),
        job_description: jd.trim() || undefined,
        title: title.trim() || undefined,
      });
      toast.success(`“${resume.title}” is ready`, { description: notes || undefined, duration: 8000 });
      onDone();
      router.push(`/resumes/${resume.id}`);
    } catch (error) {
      toast.error("Couldn't create the resume", { description: errorMessage(error) });
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="gen-prompt" className="text-[13px] font-medium text-foreground/85">
          What should it look like and say?
        </label>
        <Textarea
          id="gen-prompt"
          autoFocus
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={4000}
          placeholder="e.g. One page, classic serif with a navy accent. Lead with my Python and FastAPI work, cut old internships, keep the summary to two lines."
          className="min-h-32 text-[15px]"
        />
        <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Ideas">
          {PROMPT_IDEAS.map((idea) => (
            <li key={idea}>
              <button
                type="button"
                onClick={() => setPrompt(idea)}
                className="rounded-full border bg-surface px-3 py-1 text-left text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
              >
                {idea.split(".")[0]}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {showJd ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="gen-jd" className="text-[13px] font-medium text-foreground/85">
            Job post to tailor to
          </label>
          <Textarea
            id="gen-jd"
            rows={5}
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            maxLength={12000}
            placeholder="Paste the job description"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowJd(true)}
          className="self-start text-sm font-medium text-primary-strong hover:underline"
        >
          + Tailor to a job post
        </button>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="gen-title" className="text-[13px] font-medium text-foreground/85">
          Name <span className="font-normal text-muted-foreground">(optional, the AI picks one)</span>
        </label>
        <Input
          id="gen-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Backend - Stripe"
        />
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-surface-2/70 px-3 py-2 text-xs text-muted-foreground">
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        Mandy never invents employers, dates, degrees or numbers. Keep your profile up to date for the best result.
      </p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={generate.isPending || prompt.trim().length < 3}>
          {generate.isPending ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : (
            <Wand2 data-icon="inline-start" />
          )}
          {generate.isPending ? "Writing your resume…" : "Create resume"}
        </Button>
      </div>
    </form>
  );
};

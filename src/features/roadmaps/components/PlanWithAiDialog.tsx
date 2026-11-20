"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, KeyRound, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Orb } from "@/components/shared/Orb";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { applyApiErrors } from "@/lib/api/form-errors";
import { duration, easeOut } from "@/lib/motion";
import { DatePicker } from "@/features/tasks";
import { useGenerateRoadmap } from "../hooks";
import { planFormSchema, type PlanFormValues } from "../schemas";

const AI_KEY_URL = "https://aistudio.google.com/apikey";

type PlanWithAiDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** `POST /roadmaps/generate`: Mandy drafts 4-8 milestones with resources. */
export const PlanWithAiDialog = ({ open, onOpenChange }: PlanWithAiDialogProps) => {
  const router = useRouter();
  const generate = useGenerateRoadmap();
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: { goal: "", target_date: null, hours_per_week: 6 },
  });
  const errors = form.formState.errors;
  const aiError = generate.error instanceof ApiError ? generate.error : null;
  const unavailable = aiError?.code === "AI_UNAVAILABLE" || aiError?.status === 503;
  const rateLimited = aiError?.code === "AI_RATE_LIMITED" || aiError?.status === 429;

  const submit = form.handleSubmit((values) =>
    generate.mutate(values, {
      onSuccess: (detail) => {
        toast.success(`Mandy planned ${detail.milestones.length} milestones for “${detail.title}”.`);
        onOpenChange(false);
        form.reset();
        generate.reset();
        router.push(`/roadmaps/${detail.id}`);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 422) applyApiErrors(error, form.setError, ["goal", "target_date", "hours_per_week"]);
      },
    }),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (generate.isPending) return; // keep the thinking state visible until it's done
        onOpenChange(next);
        if (!next) generate.reset();
      }}
    >
      <DialogContent className="overflow-hidden sm:max-w-lg">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-brand-gradient opacity-10 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <AnimatePresence mode="wait" initial={false}>
          {generate.isPending ? (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.base, ease: easeOut }}
              className="relative flex flex-col items-center gap-4 py-10 text-center"
              role="status"
              aria-live="polite"
            >
              <Orb size={88} thinking />
              <DialogTitle className="text-lg font-semibold">Mandy is planning your roadmap…</DialogTitle>
              <p className="max-w-xs text-sm text-muted-foreground">Breaking “{form.getValues("goal")}” into milestones and finding good resources. This takes a few seconds.</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: duration.fast }}
              onSubmit={submit}
              noValidate
              className="relative grid gap-4"
            >
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <Orb size={36} />
                  <div className="grid gap-1">
                    <DialogTitle className="text-lg font-semibold">Plan with AI</DialogTitle>
                    <DialogDescription>Describe your goal. Mandy drafts milestones you can edit.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {unavailable && (
                <div role="alert" className="flex gap-3 rounded-lg border border-warning/30 bg-warning-soft p-3 text-sm">
                  <KeyRound className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  <div className="grid gap-1">
                    <p className="font-medium">AI planning is off</p>
                    <p className="text-muted-foreground">
                      Add a free Gemini API key as <code className="font-mono text-xs">GEMINI_API_KEY</code> on the server, then try again.
                    </p>
                    <a href={AI_KEY_URL} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-1 font-medium text-primary-strong underline-offset-4 hover:underline">
                      Get a key at Google AI Studio <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </div>
                </div>
              )}
              {!unavailable && aiError && aiError.status !== 422 && (
                <p role="alert" className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">
                  {rateLimited ? "Mandy hit the AI rate limit. Wait a minute and try again." : errorMessage(aiError)}
                </p>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="plan-goal">Goal</Label>
                <Textarea
                  id="plan-goal"
                  rows={3}
                  autoFocus
                  placeholder="Become a backend engineer who can ship FastAPI services with Postgres and Docker"
                  aria-invalid={!!errors.goal}
                  {...form.register("goal")}
                />
                {errors.goal && <p className="text-xs text-destructive">{errors.goal.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <div className="grid gap-1.5">
                  <Label htmlFor="plan-target">Target date</Label>
                  <Controller
                    control={form.control}
                    name="target_date"
                    render={({ field }) => <DatePicker id="plan-target" value={field.value} onChange={field.onChange} shortcuts={false} placeholder="Optional" />}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="plan-hours">Hours / week</Label>
                  <Input
                    id="plan-hours"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={80}
                    className="h-11 font-mono tabular-nums sm:h-9"
                    aria-invalid={!!errors.hours_per_week}
                    {...form.register("hours_per_week", { setValueAs: (v) => (v === "" || v == null ? null : Number(v)) })}
                  />
                  {errors.hours_per_week && <p className="text-xs text-destructive">{errors.hours_per_week.message}</p>}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="h-11 bg-brand-gradient sm:h-9">
                  <Sparkles data-icon="inline-start" />
                  {aiError ? "Try again" : "Plan my roadmap"}
                </Button>
              </DialogFooter>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

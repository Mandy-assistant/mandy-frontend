"use client";

import { Check, ExternalLink, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { useAiRewrite } from "../hooks";
import type { RewriteKind } from "../types";

export const AI_KEY_URL = "https://aistudio.google.com/apikey";

/** "Improve with AI" for one piece of text: shows the suggestion with Accept / Discard. */
export const AiAssist = ({
  text,
  kind,
  onAccept,
  label = "Improve with AI",
  compact = false,
}: {
  text: string;
  kind: RewriteKind;
  onAccept: (text: string) => void;
  label?: string;
  compact?: boolean;
}) => {
  const rewrite = useAiRewrite();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const empty = !text.trim();

  const run = async () => {
    setError(null);
    setSuggestion(null);
    try {
      const res = await rewrite.mutateAsync({ text, kind });
      setSuggestion(res.text);
    } catch (e) {
      setError(e);
    }
  };

  const close = () => {
    setSuggestion(null);
    setError(null);
  };

  const unavailable = error instanceof ApiError && error.code === "AI_UNAVAILABLE";
  const rateLimited = error instanceof ApiError && error.code === "AI_RATE_LIMITED";

  return (
    <div className="contents">
      <Button
        type="button"
        variant="ghost"
        size={compact ? "icon" : "sm"}
        onClick={run}
        disabled={empty || rewrite.isPending}
        aria-label={compact ? label : undefined}
        title={empty ? "Write something first" : label}
        className={cn(
          "shrink-0 text-primary-strong hover:bg-primary-soft hover:text-primary-strong",
          compact ? "size-10 rounded-xl md:size-9" : "h-9 rounded-xl px-2.5 md:h-8",
        )}
      >
        {rewrite.isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
        {!compact && (rewrite.isPending ? "Thinking…" : label)}
      </Button>
      <AnimatePresence initial={false}>
        {(suggestion !== null || !!error) && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: duration.base, ease: easeOut }}
            className="basis-full"
            aria-live="polite"
          >
            {suggestion !== null ? (
              <div className="relative mt-2 overflow-hidden rounded-2xl border border-primary/30 bg-primary-soft/50 p-3.5">
                <div aria-hidden className="absolute inset-y-0 left-0 w-1 bg-brand-gradient" />
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.08em] text-primary-strong uppercase">
                  <Sparkles className="size-3.5" aria-hidden /> Suggestion
                </p>
                <p className="text-sm leading-relaxed whitespace-pre-line">{suggestion}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 rounded-xl md:h-8"
                    onClick={() => {
                      onAccept(suggestion);
                      close();
                    }}
                  >
                    <Check data-icon="inline-start" /> Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-9 rounded-xl md:h-8"
                    onClick={run}
                    disabled={rewrite.isPending}
                  >
                    <RotateCcw data-icon="inline-start" /> Try again
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-9 rounded-xl md:h-8" onClick={close}>
                    <X data-icon="inline-start" /> Discard
                  </Button>
                </div>
              </div>
            ) : (
              <div
                role="alert"
                className="mt-2 flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-3.5 text-sm"
              >
                <Sparkles className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <div className="min-w-0 flex-1">
                  {unavailable ? (
                    <>
                      <p className="font-medium">AI isn&apos;t set up yet</p>
                      <p className="mt-0.5 text-muted-foreground">
                        Add a free Gemini key as <code className="rounded bg-surface px-1 font-mono text-xs">GEMINI_API_KEY</code>{" "}
                        in the backend&apos;s .env, then restart the API.
                      </p>
                      <a
                        href={AI_KEY_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1.5 inline-flex min-h-8 items-center gap-1 font-medium text-primary-strong hover:underline"
                      >
                        Get a Gemini API key <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </>
                  ) : (
                    <p>{rateLimited ? "Gemini's free quota is used up for now. Try again in a minute." : errorMessage(error)}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Dismiss"
                  className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-surface/60"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

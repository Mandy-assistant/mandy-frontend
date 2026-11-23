"use client";

import { ArrowUp, ChevronDown, ExternalLink, KeyRound, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Orb } from "@/components/shared/Orb";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { COMMAND_CHIPS } from "../commands";
import { actionHref, actionLabel, useAskMandy, useAssistantStatus } from "../hooks";
import type { Turn } from "../types";
import { Markdown } from "./Markdown";

const GEMINI_KEY_URL = "https://aistudio.google.com/apikey";

type Props = { onFocusCommand: () => void; className?: string };

/** "Ask Mandy" pill bar with slash commands and an expandable conversation panel (Gemini). */
export const AskMandy = ({ onFocusCommand, className }: Props) => {
  const status = useAssistantStatus();
  const aiOff = status.data?.enabled === false;
  const { turns, busy, submit, retry, clear } = useAskMandy({ onFocusCommand });
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const send = async (text: string) => {
    const ok = await submit(text);
    if (ok) {
      setValue("");
      setOpen(true);
    }
  };

  // "/" focuses the bar from anywhere on the page (⌘K is the global command palette).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // /?ask=<text> from the command palette: submit once, then strip the param.
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const askParam = params.get("ask");
  const handledAsk = useRef<string | null>(null);
  const sendRef = useRef(send);
  useEffect(() => {
    sendRef.current = send;
  });
  useEffect(() => {
    if (!askParam) {
      handledAsk.current = null;
      return;
    }
    if (handledAsk.current === askParam) return;
    handledAsk.current = askParam;
    void sendRef.current(askParam);
    const sp = new URLSearchParams(params.toString());
    sp.delete("ask");
    router.replace(sp.size ? `${pathname}?${sp}` : pathname, { scroll: false });
  }, [askParam, params, pathname, router]);

  const placeholder = aiOff
    ? "Try /task Read the attention paper, or /job Vercel — Frontend Engineer"
    : "Ask Mandy anything, or try /task Read the attention paper";

  const insert = (cmd: string) => {
    setValue(cmd);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(cmd.length, cmd.length);
    });
  };

  const hasTurns = turns.length > 0;

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(value);
        }}
        className="flex items-center gap-3 rounded-full border bg-surface py-2 pr-2 pl-4 shadow-card transition-[border-color,box-shadow] focus-within:border-primary focus-within:shadow-[0_0_0_4px_var(--primary-soft),var(--shadow-card)] sm:pl-[22px]"
      >
        {busy ? <Orb size={22} thinking /> : <Sparkles className="size-[22px] shrink-0 text-primary" aria-hidden />}
        <label htmlFor="ask-mandy" className="sr-only">
          Ask Mandy
        </label>
        <input
          ref={inputRef}
          id="ask-mandy"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="send"
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ellipsis placeholder:text-muted-foreground"
        />
        <div className="hidden items-center gap-1.5 lg:flex">
          {COMMAND_CHIPS.slice(0, 4).map((c) => (
            <button
              key={c.label}
              type="button"
              title={c.hint}
              onClick={() => insert(c.cmd)}
              className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary-strong"
            >
              {c.label}
            </button>
          ))}
        </div>
        <kbd
          className="hidden rounded-lg bg-primary-soft px-2 py-0.5 font-mono text-xs text-primary-strong xl:block"
          title="Press / to focus"
        >
          /
        </kbd>
        <button
          type="submit"
          disabled={!value.trim() || busy}
          aria-label="Send"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-glow transition-[opacity,transform] hover:-translate-y-px disabled:pointer-events-none disabled:opacity-35 disabled:shadow-none"
        >
          <ArrowUp className="size-[18px]" aria-hidden />
        </button>
      </form>

      {/* Chips stay reachable on smaller screens */}
      <div className="-mx-4 scrollbar-none flex gap-1.5 overflow-x-auto px-4 lg:hidden">
        {COMMAND_CHIPS.map((c) => (
          <button
            key={c.label}
            type="button"
            onClick={() => insert(c.cmd)}
            aria-label={`${c.label}: ${c.hint}`}
            className="flex h-9 shrink-0 items-center rounded-full border bg-surface px-3 font-mono text-xs text-muted-foreground transition-colors hover:text-primary-strong"
          >
            {c.label}
          </button>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {hasTurns && (
          <motion.section
            key="panel"
            aria-label="Conversation with Mandy"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: duration.base, ease: easeOut }}
            className="relative overflow-hidden rounded-xl border bg-card shadow-card"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand-gradient opacity-70" />
            <header className="flex items-center gap-2 px-4 py-2.5 sm:px-5">
              <Orb size={20} thinking={busy} />
              <p className="text-[11px] font-semibold tracking-[0.08em] text-primary-strong uppercase">Mandy</p>
              {status.data?.enabled && <span className="font-mono text-[11px] text-muted-foreground">{status.data.model}</span>}
              <div className="ml-auto flex items-center gap-1">
                <button
                  type="button"
                  onClick={clear}
                  disabled={busy}
                  className="flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  aria-expanded={open}
                  aria-controls="mandy-conversation"
                  aria-label={open ? "Collapse conversation" : "Expand conversation"}
                  className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <ChevronDown className={cn("size-4 transition-transform", !open && "-rotate-90")} aria-hidden />
                </button>
              </div>
            </header>
            {open ? (
              <Conversation turns={turns} onRetry={retry} />
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="block w-full truncate border-t px-5 py-3 text-left text-sm text-muted-foreground hover:text-foreground"
              >
                {summaryOf(turns)}
              </button>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

const summaryOf = (turns: Turn[]) => {
  const n = turns.filter((t) => t.role === "user").length;
  return `${n} message${n === 1 ? "" : "s"} · tap to expand`;
};

const Conversation = ({ turns, onRetry }: { turns: Turn[]; onRetry: (id: string, text: string) => void }) => {
  const reduced = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? "auto" : "smooth" });
  }, [turns, reduced]);

  return (
    <div
      ref={scroller}
      id="mandy-conversation"
      className="max-h-[min(460px,60dvh)] overflow-y-auto border-t px-4 py-4 sm:px-5"
      aria-live="polite"
    >
      <ol className="flex flex-col gap-4">
        {turns.map((t, i) => (
          <motion.li
            key={t.id}
            layout="position"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.base, ease: easeOut }}
          >
            {t.role === "user" ? (
              <div className="flex justify-end">
                <p className="max-w-[85%] rounded-[18px] rounded-br-md bg-primary-soft px-4 py-2.5 text-[15px] break-words text-foreground">
                  {t.content}
                </p>
              </div>
            ) : (
              <ModelTurn turn={t} prevUserText={prevUser(turns, i)} onRetry={onRetry} />
            )}
          </motion.li>
        ))}
      </ol>
    </div>
  );
};

const prevUser = (turns: Turn[], i: number) => {
  const prev = turns[i - 1];
  return prev?.role === "user" ? prev.content : "";
};

const ModelTurn = ({
  turn,
  prevUserText,
  onRetry,
}: {
  turn: Exclude<Turn, { role: "user" }>;
  prevUserText: string;
  onRetry: (id: string, text: string) => void;
}) => (
  <div className="flex gap-3">
    <Orb size={26} thinking={turn.status === "pending"} className="mt-0.5" />
    <div className="min-w-0 flex-1">
      {turn.status === "pending" && (
        <p className="flex h-[26px] items-center gap-2 text-sm text-muted-foreground" role="status">
          {turn.label}
          <span aria-hidden className="flex gap-1">
            {[0, 1, 2].map((d) => (
              <span
                key={d}
                className="size-1.5 animate-[pulse-dot_1.2s_ease-in-out_infinite] rounded-full bg-primary"
                style={{ animationDelay: `${d * 160}ms` }}
              />
            ))}
          </span>
        </p>
      )}

      {turn.status === "done" && (
        <>
          <Markdown text={turn.content} />
          {turn.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {turn.actions.map((a) => (
                <Link
                  key={`${a.type}-${a.id}`}
                  href={actionHref(a)}
                  className="group inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-success/25 bg-success-soft pr-3 pl-2.5 text-xs font-medium text-success transition-colors hover:border-success/50"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden />
                  <span className="truncate">
                    {actionLabel(a)} · <span className="text-foreground">{a.title}</span>
                  </span>
                  <span className="shrink-0 text-primary-strong group-hover:underline">View</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {turn.status === "error" && turn.code === "AI_UNAVAILABLE" && (
        <div className="rounded-lg border border-primary/20 bg-primary-soft/60 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-4 text-primary-strong" aria-hidden />
            Add a free Gemini key to enable answers
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a key in Google AI Studio, set{" "}
            <code className="rounded bg-surface-2 px-1 font-mono text-xs">GEMINI_API_KEY</code> in the backend
            <code className="ml-1 rounded bg-surface-2 px-1 font-mono text-xs">.env</code> and restart the API. Slash commands
            like /task and /job work without it.
          </p>
          <a
            href={GEMINI_KEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-glow hover:-translate-y-px"
          >
            Get a free key <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      )}

      {turn.status === "error" && turn.code !== "AI_UNAVAILABLE" && (
        <div
          className={cn(
            "rounded-lg px-3.5 py-2.5 text-sm",
            turn.code === "COMMAND" ? "bg-surface-2 text-muted-foreground" : "bg-destructive-soft/60 text-foreground",
          )}
        >
          <p role={turn.code === "COMMAND" ? undefined : "alert"}>{turn.message}</p>
          {turn.retry && prevUserText && (
            <button
              type="button"
              onClick={() => onRetry(turn.id, prevUserText)}
              className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-full border bg-surface px-3 text-xs font-medium hover:border-primary/40"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

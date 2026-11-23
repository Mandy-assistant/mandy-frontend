"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { userTimeZone } from "@/lib/greeting";
import { assistantApi } from "./api";
import { parseCommand } from "./commands";
import { assistantKeys } from "./keys";
import type { AssistantAction, ChatMessage, Turn } from "./types";

export const useAssistantStatus = () =>
  useQuery({
    queryKey: assistantKeys.status(),
    queryFn: ({ signal }) => assistantApi.status(signal),
    staleTime: 5 * 60_000,
    retry: false,
  });

const HISTORY_LIMIT = 12;

/** Query prefixes touched by each kind of thing Mandy can create. */
const AFFECTS: Record<AssistantAction["type"], string> = {
  task_created: "tasks",
  job_created: "jobs",
  roadmap_created: "roadmaps",
};

export const actionHref = (a: AssistantAction) =>
  a.type === "task_created" ? "/tasks" : a.type === "job_created" ? "/jobs" : `/roadmaps/${a.id}`;

export const actionLabel = (a: AssistantAction) =>
  a.type === "task_created" ? "Task created" : a.type === "job_created" ? "Job saved" : "Roadmap created";

type Options = { onFocusCommand: () => void };

/**
 * The Ask bar's brain: slash commands call the API directly, everything else goes to Gemini via
 * POST /assistant/ask with the conversation so far. Turns are kept in memory for this visit.
 */
export const useAskMandy = ({ onFocusCommand }: Options) => {
  const qc = useQueryClient();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);
  const nextId = () => `t${++seq.current}`;

  const replace = (id: string, turn: Turn) => setTurns((ts) => ts.map((t) => (t.id === id ? turn : t)));

  const invalidate = useCallback(
    (prefixes: string[]) => {
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      new Set(prefixes).forEach((p) => qc.invalidateQueries({ queryKey: [p] }));
    },
    [qc],
  );

  const failTurn = (id: string, error: unknown, retry?: string): Turn => {
    const code = error instanceof ApiError ? error.code : "UNKNOWN";
    const message =
      code === "AI_UNAVAILABLE"
        ? "Mandy's answers need a Gemini API key."
        : code === "AI_RATE_LIMITED"
          ? "Mandy hit the Gemini free-tier limit. Give it a minute and try again."
          : errorMessage(error);
    return { id, role: "model", status: "error", code, message, retry: code === "AI_UNAVAILABLE" ? undefined : retry };
  };

  /** Runs `raw` on top of the conversation `base` (the current turns, or fewer when retrying). */
  const run = async (raw: string, base: Turn[]): Promise<boolean> => {
    const text = raw.trim();
    if (!text || busy) return false;
    const cmd = parseCommand(text);

    if (cmd.kind === "news") {
      router.push(cmd.q ? `/news?q=${encodeURIComponent(cmd.q)}` : "/news");
      return true;
    }
    if (cmd.kind === "focus") {
      onFocusCommand();
      return true;
    }

    const userTurn: Turn = { id: nextId(), role: "user", content: text };
    const replyId = nextId();

    if (cmd.kind === "invalid") {
      setTurns([...base, userTurn, { id: replyId, role: "model", status: "error", code: "COMMAND", message: cmd.message }]);
      return true;
    }

    const label =
      cmd.kind === "task"
        ? "Adding your task…"
        : cmd.kind === "job"
          ? "Saving the job…"
          : cmd.kind === "plan"
            ? "Planning your roadmap…"
            : "Thinking…";
    // History = finished exchanges before this one.
    const history: ChatMessage[] = base
      .flatMap((t): ChatMessage[] =>
        t.role === "user"
          ? [{ role: "user", content: t.content }]
          : t.status === "done"
            ? [{ role: "model", content: t.content }]
            : [],
      )
      .slice(-HISTORY_LIMIT);

    setTurns([...base, userTurn, { id: replyId, role: "model", status: "pending", label }]);
    setBusy(true);
    try {
      if (cmd.kind === "task") {
        const task = await assistantApi.createTask({ title: cmd.title });
        replace(replyId, {
          id: replyId,
          role: "model",
          status: "done",
          content: `Added **${task.title}** to your tasks.`,
          actions: [{ type: "task_created", id: task.id, title: task.title }],
        });
        invalidate(["tasks"]);
      } else if (cmd.kind === "job") {
        const job = await assistantApi.createJob({ company: cmd.company, role: cmd.role, status: "saved" });
        replace(replyId, {
          id: replyId,
          role: "model",
          status: "done",
          content: `Saved **${job.role}** at **${job.company}** to your job board.`,
          actions: [{ type: "job_created", id: job.id, title: `${job.company} — ${job.role}` }],
        });
        invalidate(["jobs"]);
      } else if (cmd.kind === "plan") {
        const roadmap = await assistantApi.generateRoadmap({ goal: cmd.goal });
        const count = roadmap.milestones?.length ?? roadmap.milestone_count ?? 0;
        replace(replyId, {
          id: replyId,
          role: "model",
          status: "done",
          content: `Your roadmap **${roadmap.title}** is ready${count ? ` with **${count} milestones**` : ""}. Opening it now…`,
          actions: [{ type: "roadmap_created", id: roadmap.id, title: roadmap.title }],
        });
        invalidate(["roadmaps"]);
        router.push(`/roadmaps/${roadmap.id}`);
      } else {
        const res = await assistantApi.ask({ message: cmd.message, history, tz: userTimeZone() });
        replace(replyId, { id: replyId, role: "model", status: "done", content: res.reply, actions: res.actions ?? [] });
        if (res.actions?.length) invalidate(res.actions.map((a) => AFFECTS[a.type]));
      }
    } catch (error) {
      replace(replyId, failTurn(replyId, error, text));
      if (error instanceof ApiError && error.code === "AI_UNAVAILABLE")
        qc.invalidateQueries({ queryKey: assistantKeys.status() });
    } finally {
      setBusy(false);
    }
    return true;
  };

  const submit = (raw: string) => run(raw, turns);

  /** Retry drops the failed exchange and sends the same text again. */
  const retry = (turnId: string, text: string) => {
    const i = turns.findIndex((t) => t.id === turnId);
    void run(text, i > 0 ? turns.slice(0, i - 1) : turns);
  };

  const clear = () => setTurns([]);

  return { turns, busy, submit, retry, clear };
};

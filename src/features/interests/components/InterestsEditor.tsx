"use client";

import { BellOff, Brain, Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/states";
import { cn } from "@/utils/cn";
import { useInterests, useUpdateInterests } from "../hooks";
import type { Interests, JobRegion } from "../types";

const REGIONS: { value: JobRegion; label: string; hint: string }[] = [
  { value: "remote", label: "Remote", hint: "Open to people in India" },
  { value: "india", label: "India", hint: "On-site or hybrid" },
  { value: "anywhere", label: "Anywhere", hint: "No location filter" },
];

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 50);

const Chip = ({ label, tone, onRemove }: { label: string; tone: "follow" | "mute"; onRemove: () => void }) => (
  <li
    className={cn(
      "inline-flex h-8 items-center gap-1 rounded-full pr-1 pl-3 text-[13px] font-medium",
      tone === "follow" ? "bg-primary-soft text-primary-strong" : "bg-surface-2 text-muted-foreground line-through",
    )}
  >
    {label}
    <button
      type="button"
      onClick={onRemove}
      aria-label={`${tone === "follow" ? "Unfollow" : "Unmute"} ${label}`}
      className="grid size-6 place-items-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
    >
      <X className="size-3.5" aria-hidden />
    </button>
  </li>
);

const AddTopic = ({ placeholder, onAdd }: { placeholder: string; onAdd: (topic: string) => void }) => {
  const [text, setText] = useState("");
  const submit = () => {
    const t = norm(text);
    if (t) onAdd(t);
    setText("");
  };
  return (
    <div className="relative">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={50}
        className="h-10 w-full rounded-full border bg-surface pr-11 pl-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft"
      />
      <button
        type="button"
        onClick={submit}
        aria-label="Add"
        className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
        disabled={!text.trim()}
      >
        <Plus className="size-4" aria-hidden />
      </button>
    </div>
  );
};

type Props = { showRegions?: boolean; showContext?: boolean; compact?: boolean };

/**
 * What Mandy knows you care about: followed and muted topics, what it learned from your
 * activity, your job regions, and the exact context the AI gets.
 */
export const InterestsEditor = ({ showRegions = true, showContext = true, compact = false }: Props) => {
  const query = useInterests();
  const update = useUpdateInterests();

  if (query.isPending)
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-full rounded-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  if (query.isError)
    return <ErrorState error={query.error} onRetry={() => query.refetch()} title="Couldn't load your interests" />;

  const data: Interests = query.data;
  const follow = (t: string) =>
    update.mutate({ followed: [...data.followed.filter((x) => x !== t), t], muted: data.muted.filter((x) => x !== t) });
  const mute = (t: string) =>
    update.mutate({ muted: [...data.muted.filter((x) => x !== t), t], followed: data.followed.filter((x) => x !== t) });
  const learned = data.learned
    .filter((l) => !data.followed.includes(l.term) && !data.muted.includes(l.term))
    .slice(0, compact ? 12 : 24);
  const maxWeight = Math.max(1, ...learned.map((l) => l.weight));

  const toggleRegion = (r: JobRegion) => {
    const has = data.job_regions.includes(r);
    let next = has ? data.job_regions.filter((x) => x !== r) : [...data.job_regions, r];
    if (r === "anywhere" && !has) next = ["anywhere"];
    else if (r !== "anywhere") next = next.filter((x) => x !== "anywhere");
    update.mutate({ job_regions: next });
  };

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="int-follow" className="flex flex-col gap-2.5">
        <h3 id="int-follow" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden /> Topics you follow
        </h3>
        {data.followed.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {data.followed.map((t) => (
              <Chip
                key={t}
                label={t}
                tone="follow"
                onRemove={() => update.mutate({ followed: data.followed.filter((x) => x !== t) })}
              />
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted-foreground">Follow a few topics so your feed and job picks start sharp.</p>
        )}
        <AddTopic placeholder="Follow a topic, e.g. rust, llm agents, system design" onAdd={follow} />
      </section>

      {learned.length > 0 && (
        <section aria-labelledby="int-learned" className="flex flex-col gap-2.5">
          <h3 id="int-learned" className="flex items-center gap-2 text-sm font-semibold">
            <Brain className="size-4 text-primary" aria-hidden /> Learned from what you do
          </h3>
          <p className="-mt-1 text-[13px] text-muted-foreground">
            From your likes, saves, searches, skills and tracked jobs. Tap to follow, or mute what doesn&apos;t fit.
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {learned.map((l) => (
              <li
                key={l.term}
                className="inline-flex h-8 items-center overflow-hidden rounded-full border bg-surface text-[13px]"
              >
                <button
                  type="button"
                  onClick={() => follow(l.term)}
                  className="flex h-full items-center gap-1.5 pr-2 pl-3 font-medium hover:bg-surface-2"
                  aria-label={`Follow ${l.term}`}
                >
                  <span
                    aria-hidden
                    className="h-1.5 rounded-full bg-primary"
                    style={{ width: `${Math.round(6 + 18 * (l.weight / maxWeight))}px` }}
                  />
                  {l.term}
                </button>
                <button
                  type="button"
                  onClick={() => mute(l.term)}
                  aria-label={`Mute ${l.term}`}
                  className="grid h-full w-8 place-items-center border-l text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <BellOff className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="int-muted" className="flex flex-col gap-2.5">
        <h3 id="int-muted" className="flex items-center gap-2 text-sm font-semibold">
          <BellOff className="size-4 text-muted-foreground" aria-hidden /> Muted
        </h3>
        {data.muted.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {data.muted.map((t) => (
              <Chip key={t} label={t} tone="mute" onRemove={() => update.mutate({ muted: data.muted.filter((x) => x !== t) })} />
            ))}
          </ul>
        )}
        <AddTopic placeholder="Mute a topic, e.g. crypto" onAdd={mute} />
      </section>

      {showRegions && (
        <section aria-labelledby="int-regions" className="flex flex-col gap-2.5">
          <h3 id="int-regions" className="text-sm font-semibold">
            Where you want to work
          </h3>
          <div role="group" aria-labelledby="int-regions" className="grid grid-cols-3 gap-2">
            {REGIONS.map((r) => {
              const on = data.job_regions.includes(r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleRegion(r.value)}
                  className={cn(
                    "flex flex-col items-start rounded-xl border-[1.5px] px-3 py-2 text-left transition-colors",
                    on ? "border-primary bg-primary-soft/50" : "hover:border-primary/40",
                  )}
                >
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-[11.5px] text-muted-foreground">{r.hint}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {showContext && (
        <details className="group rounded-xl border bg-surface-2/50 px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold marker:text-muted-foreground">
            What Mandy tells the AI about you
          </summary>
          <pre className="mt-2 font-sans text-[12.5px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
            {data.context}
          </pre>
        </details>
      )}
    </div>
  );
};

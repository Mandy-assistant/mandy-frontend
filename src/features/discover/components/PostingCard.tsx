"use client";

import { Check, ExternalLink, EyeOff, Globe2, MapPin, Plus, Sparkles, TriangleAlert, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/features/news/format";
import { cn } from "@/utils/cn";
import { useHidePosting, useTrackPosting } from "../hooks";
import type { Posting } from "../types";

const FitRing = ({ value }: { value: number }) => {
  const r = 20;
  const c = 2 * Math.PI * r;
  const tone = value >= 75 ? "text-success" : value >= 50 ? "text-primary" : "text-muted-foreground";
  return (
    <div className="relative grid size-[52px] shrink-0 place-items-center" aria-label={`AI fit ${value} out of 100`} role="img">
      <svg viewBox="0 0 48 48" className={cn("absolute inset-0 -rotate-90", tone)} aria-hidden>
        <circle cx="24" cy="24" r={r} className="fill-none stroke-current opacity-15" strokeWidth="4" />
        <circle
          cx="24"
          cy="24"
          r={r}
          className="fill-none stroke-current"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <span className="text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
};

const Logo = ({ posting }: { posting: Posting }) => {
  const [failed, setFailed] = useState(false);
  if (posting.logo_url && !failed)
    return (
      <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border bg-white">
        <Image
          src={posting.logo_url}
          alt=""
          fill
          unoptimized
          sizes="44px"
          className="object-contain p-1"
          onError={() => setFailed(true)}
        />
      </span>
    );
  return (
    <span
      aria-hidden
      className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-sm font-bold text-white"
    >
      {posting.company.slice(0, 2).toUpperCase()}
    </span>
  );
};

export const PostingCard = ({ posting }: { posting: Posting }) => {
  const track = useTrackPosting();
  const hide = useHidePosting();
  const tracked = posting.status === "tracked";

  return (
    <article
      className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-card sm:p-5"
      aria-labelledby={`p-${posting.id}`}
    >
      <header className="flex items-start gap-3">
        <Logo posting={posting} />
        <div className="min-w-0 flex-1">
          <h3 id={`p-${posting.id}`} className="text-[15px] leading-snug font-semibold">
            <a href={posting.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {posting.role}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </h3>
          <p className="truncate text-sm text-muted-foreground">{posting.company}</p>
        </div>
        {posting.fit ? (
          <FitRing value={posting.fit.fit} />
        ) : (
          posting.match_score > 0 && (
            <span className="shrink-0 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted-foreground tabular-nums">
              {posting.match_score}% match
            </span>
          )
        )}
      </header>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        {posting.location && (
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {posting.location}
          </li>
        )}
        {posting.remote && (
          <li className="inline-flex items-center gap-1.5">
            <Globe2 className="size-3.5" aria-hidden />
            Remote
          </li>
        )}
        {posting.salary && (
          <li className="inline-flex items-center gap-1.5">
            <Wallet className="size-3.5" aria-hidden />
            {posting.salary}
          </li>
        )}
        <li>
          {posting.source} · <time dateTime={posting.posted_at}>{timeAgo(posting.posted_at)}</time>
        </li>
      </ul>

      {posting.fit ? (
        <div className="flex flex-col gap-1.5 rounded-xl bg-surface-2/70 px-3.5 py-2.5 text-[13px]">
          <p className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
            <span>{posting.fit.reason}</span>
          </p>
          {posting.fit.gaps && (
            <p className="flex items-start gap-2 text-muted-foreground">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
              <span>
                <span className="sr-only">Gaps: </span>
                {posting.fit.gaps}
              </span>
            </p>
          )}
        </div>
      ) : (
        posting.summary && <p className="line-clamp-2 text-[13px] text-muted-foreground">{posting.summary}</p>
      )}

      {posting.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {posting.tags.slice(0, 6).map((t) => (
            <li key={t} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t}
            </li>
          ))}
        </ul>
      )}

      <footer className="flex flex-wrap items-center gap-2 pt-1">
        {tracked ? (
          <Button variant="outline" nativeButton={false} render={<Link href="/jobs" />} className="h-10">
            <Check data-icon="inline-start" aria-hidden />
            In your tracker
          </Button>
        ) : (
          <Button onClick={() => track.mutate(posting)} disabled={track.isPending} className="h-10">
            <Plus data-icon="inline-start" aria-hidden />
            {track.isPending ? "Adding…" : "Track"}
          </Button>
        )}
        <Button
          variant="ghost"
          nativeButton={false}
          render={<a href={posting.url} target="_blank" rel="noopener noreferrer" />}
          className="h-10"
        >
          <ExternalLink data-icon="inline-start" aria-hidden />
          View listing
        </Button>
        {!tracked && (
          <Button
            variant="ghost"
            onClick={() => hide.mutate(posting)}
            className="ml-auto h-10 text-muted-foreground"
            aria-label={`Hide ${posting.role} at ${posting.company}`}
          >
            <EyeOff data-icon="inline-start" aria-hidden />
            Hide
          </Button>
        )}
      </footer>
    </article>
  );
};

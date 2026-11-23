"use client";

import { Bookmark, ChevronLeft, ChevronRight, ExternalLink, Heart, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/utils/cn";
import { categoryMeta, compactNumber, sourceInitials } from "../categories";
import { timeAgo } from "../format";
import { useMarkOpened, useNewsSources, useSourceStories, useToggleNewsLike, useToggleNewsSave } from "../hooks";
import type { NewsItem } from "../types";
import { SourceAvatar } from "./FeedPost";

const STORY_MS = 7000;

/** The row of source circles at the top of the feed. Tapping one opens its stories. */
export const StoriesRow = ({ onInterests }: { onInterests: () => void }) => {
  const sources = useNewsSources();
  const [open, setOpen] = useState<number | null>(null);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const list = sources.data ?? [];

  return (
    <>
      <nav aria-label="Stories by source" className="-mx-4 scrollbar-none overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <ul className="flex gap-3.5">
          <li>
            <button type="button" onClick={onInterests} className="flex w-[72px] flex-col items-center gap-1.5">
              <span className="grid size-[66px] place-items-center rounded-full border-2 border-dashed border-primary/50 bg-primary-soft text-primary">
                <Sparkles className="size-6" aria-hidden />
              </span>
              <span className="w-full truncate text-center text-[11.5px] font-medium">Your interests</span>
            </button>
          </li>
          {sources.isPending &&
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex w-[72px] flex-col items-center gap-1.5">
                <Skeleton className="size-[66px] rounded-full" />
                <Skeleton className="h-3 w-12" />
              </li>
            ))}
          {list.map((s, i) => (
            <li key={s.source}>
              <button
                type="button"
                onClick={() => {
                  setOpen(i);
                  setSeen((prev) => new Set(prev).add(s.source));
                }}
                className="flex w-[72px] flex-col items-center gap-1.5"
                aria-label={`${s.source}: ${s.count} new stories`}
              >
                <span className={cn("rounded-full", seen.has(s.source) && "opacity-60 grayscale")}>
                  <SourceAvatar source={s.source} size={66} ring />
                </span>
                <span className="w-full truncate text-center text-[11.5px]">{s.source}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {open !== null && list[open] && (
        <StoryViewer
          sources={list.map((s) => s.source)}
          index={open}
          onIndex={(i) => {
            setOpen(i);
            if (list[i]) setSeen((prev) => new Set(prev).add(list[i].source));
          }}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
};

type ViewerProps = { sources: string[]; index: number; onIndex: (i: number) => void; onClose: () => void };

/** Full-screen stories: tap right/left to move, hold to pause, swipe down or Esc to close. */
const StoryViewer = ({ sources, index, onIndex, onClose }: ViewerProps) => {
  const hydrated = useHydrated();
  const source = sources[index];
  const stories = useSourceStories(source);
  const items = stories.data ?? [];
  const [pos, setPos] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const opened = useMarkOpened();
  const like = useToggleNewsLike();
  const save = useToggleNewsSave();
  const touchY = useRef<number | null>(null);

  // New source: start from its first story.
  const [prevSource, setPrevSource] = useState(source);
  if (source !== prevSource) {
    setPrevSource(source);
    setPos(0);
    setProgress(0);
  }

  const next = useCallback(() => {
    setProgress(0);
    if (pos + 1 < items.length) setPos(pos + 1);
    else if (index + 1 < sources.length) onIndex(index + 1);
    else onClose();
  }, [pos, items.length, index, sources.length, onIndex, onClose]);

  const prev = useCallback(() => {
    setProgress(0);
    if (pos > 0) setPos(pos - 1);
    else if (index > 0) onIndex(index - 1);
  }, [pos, index, onIndex]);

  // Timer: fill the bar, then move on.
  useEffect(() => {
    if (paused || !items.length) return;
    const started = performance.now() - progress * STORY_MS;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - started) / STORY_MS);
      setProgress(p);
      if (p >= 1) next();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart only when the story or pause state changes
  }, [paused, pos, source, items.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [next, prev, onClose]);

  if (!hydrated) return null;
  const item: NewsItem | undefined = items[pos];

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${source} stories`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/95"
      onTouchStart={(e) => (touchY.current = e.touches[0].clientY)}
      onTouchEnd={(e) => {
        if (touchY.current !== null && e.changedTouches[0].clientY - touchY.current > 90) onClose();
        touchY.current = null;
      }}
    >
      <div className="relative flex h-dvh w-full max-w-[460px] flex-col overflow-hidden bg-neutral-900 text-white sm:h-[min(92dvh,820px)] sm:rounded-2xl">
        {/* progress bars */}
        <div className="absolute inset-x-2 top-2 z-20 flex gap-1 pt-[env(safe-area-inset-top)]">
          {(items.length ? items : [null]).map((_, i) => (
            <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                className="block h-full bg-white"
                style={{ width: `${i < pos ? 100 : i === pos ? Math.round(progress * 100) : 0}%` }}
              />
            </span>
          ))}
        </div>

        <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-2.5 bg-linear-to-b from-black/60 to-transparent px-3 pt-[calc(env(safe-area-inset-top)+16px)] pb-6">
          <span className="grid size-9 place-items-center rounded-full bg-white/15 text-xs font-bold">
            {sourceInitials(source)}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{source}</p>
            {item && <p className="text-xs text-white/70">{timeAgo(item.published_at)}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close stories"
            className="grid size-10 place-items-center rounded-full hover:bg-white/10"
          >
            <X className="size-6" aria-hidden />
          </button>
        </header>

        <div className="relative flex-1">
          {stories.isPending && <Skeleton className="absolute inset-0 rounded-none bg-white/10" />}
          <AnimatePresence mode="wait">
            {item && (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn("absolute inset-0", !item.image_url && categoryMeta(item.category).cover)}
              >
                {item.image_url && <Image src={item.image_url} alt="" fill unoptimized sizes="460px" className="object-cover" />}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/10" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* tap zones: left third goes back, the rest forward; hold anywhere to pause */}
          <button
            type="button"
            aria-label="Previous story"
            className="absolute inset-y-0 left-0 z-10 w-1/3"
            onClick={prev}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          />
          <button
            type="button"
            aria-label="Next story"
            className="absolute inset-y-0 right-0 z-10 w-2/3"
            onClick={next}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            onPointerLeave={() => setPaused(false)}
          />

          {item && (
            <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+18px)]">
              <h2 className="text-xl leading-snug font-bold [text-wrap:balance]">{item.title}</h2>
              {item.summary && <p className="line-clamp-3 text-sm text-white/80">{item.summary}</p>}
              {item.insight?.reason && (
                <p className="flex items-start gap-2 rounded-xl bg-white/12 px-3 py-2 text-[13px] backdrop-blur">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {item.insight.reason}
                </p>
              )}
              <div className="flex items-center gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => opened.mutate(item.id)}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white font-semibold text-neutral-900"
                >
                  Read story <ExternalLink className="size-4" aria-hidden />
                </a>
                <button
                  type="button"
                  onClick={() => like.mutate({ id: item.id, like: !item.is_liked })}
                  aria-pressed={item.is_liked}
                  aria-label={item.is_liked ? "Unlike" : "Like"}
                  className="grid size-11 place-items-center rounded-full bg-white/15"
                >
                  <Heart className={cn("size-5", item.is_liked && "fill-[#ff3040] text-[#ff3040]")} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => save.mutate({ id: item.id, save: !item.is_saved })}
                  aria-pressed={item.is_saved}
                  aria-label={item.is_saved ? "Remove from saved" : "Save"}
                  className="grid size-11 place-items-center rounded-full bg-white/15"
                >
                  <Bookmark className={cn("size-5", item.is_saved && "fill-current")} aria-hidden />
                </button>
              </div>
              {(item.score > 0 || item.comments > 0) && (
                <p className="text-xs text-white/60 tabular-nums">
                  {item.score > 0 && `${compactNumber(item.score)} points`}
                  {item.score > 0 && item.comments > 0 && " · "}
                  {item.comments > 0 && `${compactNumber(item.comments)} comments`}
                </p>
              )}
            </div>
          )}
          {!stories.isPending && !items.length && (
            <p className="absolute inset-0 grid place-items-center text-sm text-white/70">No recent stories here.</p>
          )}
        </div>

        <div className="pointer-events-none absolute inset-y-0 -left-14 hidden items-center sm:flex">
          <ChevronLeft className="size-8 text-white/50" aria-hidden />
        </div>
        <div className="pointer-events-none absolute inset-y-0 -right-14 hidden items-center sm:flex">
          <ChevronRight className="size-8 text-white/50" aria-hidden />
        </div>
      </div>
    </motion.div>,
    document.body,
  );
};

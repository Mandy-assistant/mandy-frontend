"use client";

import { Bookmark, EyeOff, Heart, Link2, MessageCircle, MoreHorizontal, Send, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import { categoryMeta, compactNumber, sourceGradient, sourceInitials } from "../categories";
import { timeAgo } from "../format";
import { useHideNews, useMarkOpened, useToggleNewsLike, useToggleNewsSave } from "../hooks";
import type { NewsItem } from "../types";
import { NewsCover } from "./NewsCover";

const KIND_LABEL: Record<NewsItem["kind"], string | null> = {
  article: null,
  discussion: "Discussion",
  repo: "Repository",
  launch: "Launch",
};

export const SourceAvatar = ({ source, size = 36, ring = false }: { source: string; size?: number; ring?: boolean }) => (
  <span
    aria-hidden
    className={cn("grid shrink-0 place-items-center rounded-full bg-linear-to-tr p-[2px]", ring ? sourceGradient(source) : "")}
    style={{ width: size, height: size }}
  >
    <span
      className={cn(
        "grid size-full place-items-center rounded-full bg-linear-to-tr font-bold text-white",
        sourceGradient(source),
        ring && "ring-2 ring-background",
      )}
      style={{ fontSize: Math.round(size * 0.34) }}
    >
      {sourceInitials(source)}
    </span>
  </span>
);

const share = async (item: NewsItem) => {
  const data = { title: item.title, url: item.url };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(item.url);
      toast.success("Link copied");
    }
  } catch {
    /* the user closed the share sheet */
  }
};

/** One story, Instagram-post style: source header, big image, action row, title, AI note. */
export const FeedPost = ({ item, priority = false }: { item: NewsItem; priority?: boolean }) => {
  const like = useToggleNewsLike();
  const save = useToggleNewsSave();
  const hide = useHideNews();
  const opened = useMarkOpened();
  const reduced = useReducedMotion();
  const [heartScope, animateHeart] = useAnimate<HTMLButtonElement>();
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);

  const toggleLike = (to = !item.is_liked) => {
    if (to !== item.is_liked) like.mutate({ id: item.id, like: to });
    if (!reduced && heartScope.current)
      animateHeart(heartScope.current, { scale: [1, 1.3, 1] }, { duration: 0.3, ease: [0.34, 1.6, 0.64, 1] });
  };

  // Double-tap (or double-click) the picture to like, like Instagram.
  const onImageTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      toggleLike(true);
      setBurst((b) => b + 1);
      lastTap.current = 0;
    } else lastTap.current = now;
  };

  const open = () => opened.mutate(item.id);
  const kind = KIND_LABEL[item.kind];
  const meta = categoryMeta(item.category);

  return (
    <article
      className="overflow-hidden border-b bg-card pb-3 sm:rounded-2xl sm:border sm:shadow-card"
      aria-labelledby={`post-${item.id}`}
    >
      <header className="flex items-center gap-3 px-3.5 py-2.5">
        <SourceAvatar source={item.source} ring />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold">{item.source}</p>
          <p className="truncate text-xs text-muted-foreground">
            <time dateTime={item.published_at}>{timeAgo(item.published_at)}</time>
            {" · "}
            {meta.label}
            {kind && ` · ${kind}`}
            {item.author && ` · ${item.author}`}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="size-10" aria-label="More options" />}>
            <MoreHorizontal />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => hide.mutate(item)}>
              <EyeOff />
              Not interested
            </DropdownMenuItem>
            {item.discussion_url && (
              <DropdownMenuItem
                onClick={() => {
                  open();
                  window.open(item.discussion_url!, "_blank", "noopener,noreferrer");
                }}
              >
                <MessageCircle />
                Open discussion
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await navigator.clipboard.writeText(item.url);
                toast.success("Link copied");
              }}
            >
              <Link2 />
              Copy link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div
        className="relative cursor-pointer select-none"
        onClick={onImageTap}
        onDoubleClick={(e) => e.preventDefault()}
        role="presentation"
      >
        <NewsCover item={item} className="aspect-[1.91/1] w-full" sizes="(min-width: 640px) 560px, 100vw" priority={priority} />
        <AnimatePresence>
          {burst > 0 && (
            <motion.span
              key={burst}
              aria-hidden
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 1.05] }}
              transition={{ duration: 0.8, times: [0, 0.25, 0.6, 1] }}
              onAnimationComplete={() => setBurst(0)}
              className="pointer-events-none absolute inset-0 grid place-items-center"
            >
              <Heart className="size-24 fill-white text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)]" />
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1 px-2 pt-1.5">
        <button
          ref={heartScope}
          type="button"
          onClick={() => toggleLike()}
          aria-pressed={item.is_liked}
          aria-label={item.is_liked ? "Unlike" : "Like"}
          className="grid size-11 place-items-center rounded-full hover:bg-surface-2"
        >
          <Heart className={cn("size-[24px] transition-colors", item.is_liked && "fill-[#ff3040] text-[#ff3040]")} aria-hidden />
        </button>
        {item.discussion_url ? (
          <a
            href={item.discussion_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={open}
            aria-label={`Discussion, ${item.comments} comments`}
            className="grid size-11 place-items-center rounded-full hover:bg-surface-2"
          >
            <MessageCircle className="size-[24px] -scale-x-100" aria-hidden />
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => share(item)}
          aria-label="Share"
          className="grid size-11 place-items-center rounded-full hover:bg-surface-2"
        >
          <Send className="size-[22px]" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => save.mutate({ id: item.id, save: !item.is_saved })}
          aria-pressed={item.is_saved}
          aria-label={item.is_saved ? "Remove from saved" : "Save"}
          className="ml-auto grid size-11 place-items-center rounded-full hover:bg-surface-2"
        >
          <Bookmark className={cn("size-[24px]", item.is_saved && "fill-current")} aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 px-3.5">
        {(item.score > 0 || item.comments > 0) && (
          <p className="text-[13px] font-semibold tabular-nums">
            {item.score > 0 && `${compactNumber(item.score)} ${item.kind === "repo" ? "stars" : "points"}`}
            {item.score > 0 && item.comments > 0 && " · "}
            {item.comments > 0 && `${compactNumber(item.comments)} comments`}
          </p>
        )}
        <h2 id={`post-${item.id}`} className="text-[15px] leading-snug font-semibold">
          <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={open} className="hover:underline">
            {item.title}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </h2>
        {item.summary && <p className="line-clamp-3 text-sm text-muted-foreground">{item.summary}</p>}
        {item.insight && item.insight.reason && (
          <p
            className={cn(
              "mt-1 flex items-start gap-2 rounded-xl px-3 py-2 text-[13px]",
              item.insight.relevance >= 60 ? "bg-primary-soft text-primary-strong" : "bg-surface-2 text-muted-foreground",
            )}
          >
            <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              <span className="sr-only">Why it matters to you: </span>
              {item.insight.reason}
            </span>
          </p>
        )}
        {item.tags.length > 0 && (
          <p className="text-[13px] text-info">
            {item.tags.slice(0, 5).map((t) => (
              <span key={t} className="mr-2">
                #{t.replace(/\s+/g, "")}
              </span>
            ))}
          </p>
        )}
      </div>
    </article>
  );
};

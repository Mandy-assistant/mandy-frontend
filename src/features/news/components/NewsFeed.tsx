"use client";

import { Bookmark, Loader2, Newspaper, RefreshCw, Search, SearchX, Sparkles, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InterestsEditor } from "@/features/interests/components/InterestsEditor";
import { ResponsiveDialog } from "@/features/profile/components/ResponsiveDialog";
import { duration, easeOut, spring } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { NEWS_TABS, isNewsTab } from "../categories";
import { useNewsFeed, useRefreshNews, useSavedNewsCount } from "../hooks";
import type { NewsTab } from "../types";
import { FeedPost } from "./FeedPost";
import { StoriesRow } from "./Stories";

const SEARCH_DEBOUNCE_MS = 300;

/** Tech news, Instagram style: stories by source, a personal "For you" feed with AI notes, tabs and search. */
export const NewsFeed = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: NewsTab = isNewsTab(tabParam) ? tabParam : "foryou";
  const q = (params.get("q") ?? "").trim();
  const [interestsOpen, setInterestsOpen] = useState(false);

  const hrefFor = (next: { tab?: NewsTab; q?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const t = next.tab ?? tab;
    const query = next.q ?? q;
    if (t === "foryou") sp.delete("tab");
    else sp.set("tab", t);
    if (query) sp.set("q", query);
    else sp.delete("q");
    const s = sp.toString();
    return s ? `${pathname}?${s}` : pathname;
  };

  // Search box: local text, pushed to ?q= after a pause. Follows the URL when it changes elsewhere.
  const [text, setText] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  if (q !== syncedQ) {
    setSyncedQ(q);
    setText(q);
  }
  useEffect(() => {
    const next = text.trim();
    if (next === q) return;
    const id = window.setTimeout(() => router.replace(hrefFor({ q: next }), { scroll: false }), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the typed text should restart the timer
  }, [text]);

  // The route stays mounted (hidden) after navigating away: close the dialog then.
  useEffect(() => () => setInterestsOpen(false), []);

  const refresh = useRefreshNews();
  const savedCount = useSavedNewsCount();

  return (
    <>
      <PageHeader
        title="Tech news"
        description="Hacker News, Reddit, DEV, GitHub, Lobsters, Product Hunt and top blogs, ranked for you."
        actions={
          <Button
            variant="outline"
            size="lg"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="h-11 md:h-10"
          >
            <RefreshCw data-icon="inline-start" className={cn(refresh.isPending && "animate-spin")} aria-hidden />
            {refresh.isPending ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-[1040px] gap-8">
        <div className="mx-auto flex w-full max-w-[560px] min-w-0 flex-col gap-4">
          <StoriesRow onInterests={() => setInterestsOpen(true)} />

          <div className="sticky top-16 z-10 -mx-4 flex flex-col gap-2.5 bg-background/85 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0 md:top-0">
            <LayoutGroup id="news-tabs">
              <nav aria-label="News tabs" className="-mx-4 scrollbar-none overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <ul className="inline-flex gap-1 rounded-full bg-surface-2 p-1">
                  {NEWS_TABS.map((t) => {
                    const active = t.value === tab;
                    return (
                      <li key={t.value} className="relative">
                        {active && (
                          <motion.span
                            layoutId="news-tab-pill"
                            transition={spring}
                            className="absolute inset-0 rounded-full bg-surface shadow-card"
                          />
                        )}
                        <Link
                          href={hrefFor({ tab: t.value })}
                          scroll={false}
                          replace
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "relative flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                            active && "text-foreground",
                          )}
                        >
                          {t.value === "foryou" && <Sparkles className="size-3.5 text-primary" aria-hidden />}
                          {t.value === "saved" && <Bookmark className="size-3.5" aria-hidden />}
                          {t.label}
                          {t.value === "saved" && savedCount.data !== undefined && (
                            <span className="font-mono text-xs text-muted-foreground tabular-nums">{savedCount.data}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </LayoutGroup>

            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={tab === "saved" ? "Search saved stories" : "Search every source"}
                aria-label="Search news"
                className="h-11 w-full rounded-full border bg-surface pr-10 pl-10 text-[15px] shadow-card transition-[border-color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft md:h-10 md:text-sm [&::-webkit-search-cancel-button]:hidden"
              />
              {text && (
                <button
                  type="button"
                  onClick={() => setText("")}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          <FeedList
            key={`${tab}:${tab === "saved" ? "" : q}`}
            tab={tab}
            q={q}
            onClear={() => setText("")}
            onRefresh={() => refresh.mutate()}
            refreshing={refresh.isPending}
            onInterests={() => setInterestsOpen(true)}
          />
        </div>

        <aside aria-label="Your interests" className="hidden w-[340px] shrink-0 xl:block">
          <div className="sticky top-24 flex max-h-[calc(100dvh-7rem)] flex-col gap-3 overflow-y-auto rounded-2xl border bg-card p-5 shadow-card">
            <h2 className="text-base font-semibold">Tune your feed</h2>
            <p className="-mt-2 text-[13px] text-muted-foreground">
              Likes, saves, searches and &ldquo;Not interested&rdquo; teach Mandy. Follow topics to steer it now.
            </p>
            <InterestsEditor showRegions={false} compact />
          </div>
        </aside>
      </div>

      <ResponsiveDialog
        open={interestsOpen}
        onOpenChange={setInterestsOpen}
        title="Your interests"
        description="What shapes your news feed and job picks."
      >
        {interestsOpen && <InterestsEditor />}
      </ResponsiveDialog>
    </>
  );
};

type ListProps = {
  tab: NewsTab;
  q: string;
  onClear: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onInterests: () => void;
};

const PostSkeleton = () => (
  <div className="flex flex-col gap-3 border-b pb-4 sm:rounded-2xl sm:border">
    <div className="flex items-center gap-3 px-3.5 pt-3">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="h-4 w-32" />
    </div>
    <Skeleton className="aspect-[1.91/1] w-full rounded-none" />
    <div className="flex flex-col gap-2 px-3.5">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

const FeedList = ({ tab, q, onClear, onRefresh, refreshing, onInterests }: ListProps) => {
  // Saved has no server-side search: fetch it unfiltered and filter here.
  const feed = useNewsFeed({ tab, q: tab === "saved" ? "" : q });
  const items = useMemo(() => {
    const all = feed.data?.pages.flatMap((p) => p.items) ?? [];
    const unique = [...new Map(all.map((n) => [n.id, n])).values()];
    if (tab !== "saved" || !q) return unique;
    const needle = q.toLowerCase();
    return unique.filter((n) => `${n.title} ${n.summary} ${n.source}`.toLowerCase().includes(needle));
  }, [feed.data, tab, q]);
  const personalizing = !!feed.data?.pages[0]?.personalizing;

  // Auto-load the next page when the sentinel scrolls near the viewport.
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (feed.isPending)
    return (
      <div className="flex flex-col gap-5">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  if (feed.isError) return <ErrorState error={feed.error} onRetry={() => feed.refetch()} title="Couldn't load the news" />;

  if (!items.length) {
    if (q)
      return (
        <EmptyState
          icon={SearchX}
          title={`No stories match “${q}”`}
          description="Try a shorter search or another tab."
          action={
            <Button variant="outline" onClick={onClear}>
              Clear search
            </Button>
          }
        />
      );
    if (tab === "saved")
      return (
        <EmptyState
          icon={Bookmark}
          title="No saved stories yet"
          description="Tap the bookmark on any story to keep it here for later."
          action={
            <Button variant="outline" nativeButton={false} render={<Link href="/news" />}>
              Browse news
            </Button>
          }
        />
      );
    return (
      <EmptyState
        icon={Newspaper}
        title="No news here yet"
        description="Mandy pulls every source on your first visit. Give it a minute, or pull now."
        action={
          <Button onClick={onRefresh} disabled={refreshing}>
            <RefreshCw data-icon="inline-start" className={cn(refreshing && "animate-spin")} aria-hidden />
            Pull the latest
          </Button>
        }
      />
    );
  }

  return (
    <section aria-label="Stories" className="-mx-4 sm:mx-0">
      {tab === "foryou" && !q && (
        <div className="mx-4 mb-4 flex items-center gap-3 rounded-2xl bg-primary-soft/60 px-4 py-3 text-[13px] text-primary-strong sm:mx-0">
          {personalizing ? (
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="size-4 shrink-0" aria-hidden />
          )}
          <p className="flex-1" aria-live="polite">
            {personalizing
              ? "Mandy is reading the top stories and noting why they matter to you…"
              : "Ranked by your interests, skills and job goals."}
          </p>
          <button type="button" onClick={onInterests} className="font-semibold underline-offset-2 hover:underline xl:hidden">
            Tune
          </button>
        </div>
      )}
      <ul className="flex flex-col gap-0 sm:gap-5">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: duration.base, ease: easeOut }}
              className="min-w-0"
            >
              <FeedPost item={item} priority={i < 2} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div ref={sentinel} className="mt-8 flex flex-col items-center gap-2 pb-4">
        {hasNextPage ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="h-11 min-w-40"
          >
            {isFetchingNextPage ? <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden /> : null}
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">You&apos;re all caught up ✨</p>
        )}
      </div>
    </section>
  );
};

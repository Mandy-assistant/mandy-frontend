"use client";

import { Bookmark, Loader2, Newspaper, RefreshCw, Search, SearchX, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { CardGridSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { duration, easeOut, spring } from "@/lib/motion";
import { cn } from "@/utils/cn";
import { NEWS_TABS, isNewsTab } from "../categories";
import { NEWS_PAGE_SIZE, useNewsFeed, useRefreshNews, useSavedNewsCount } from "../hooks";
import type { NewsTab } from "../types";
import { NewsCard } from "./NewsCard";

const SEARCH_DEBOUNCE_MS = 300;

/** FE-12: tech news feed with category tabs, search, infinite loading and bookmarks. Tab and search live in the URL. */
export const NewsFeed = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tabParam = params.get("tab");
  const tab: NewsTab = isNewsTab(tabParam) ? tabParam : "all";
  const q = (params.get("q") ?? "").trim();

  const hrefFor = (next: { tab?: NewsTab; q?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const t = next.tab ?? tab;
    const query = next.q ?? q;
    if (t === "all") sp.delete("tab");
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

  const refresh = useRefreshNews();
  const savedCount = useSavedNewsCount();

  return (
    <>
      <PageHeader
        title="Tech news"
        description="Picked for AI/ML and web development."
        actions={
          <Button
            variant="outline"
            size="lg"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="h-11 md:h-10"
          >
            <RefreshCw data-icon="inline-start" className={cn(refresh.isPending && "animate-spin")} aria-hidden />
            {refresh.isPending ? "Refreshing…" : "Refresh feeds"}
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <LayoutGroup id="news-tabs">
          <nav aria-label="News categories" className="-mx-4 scrollbar-none overflow-x-auto px-4 md:mx-0 md:px-0">
            <ul className="inline-flex gap-1 rounded-md bg-surface-2 p-1">
              {NEWS_TABS.map((t) => {
                const active = t.value === tab;
                return (
                  <li key={t.value} className="relative">
                    {active && (
                      <motion.span
                        layoutId="news-tab-pill"
                        transition={spring}
                        className="absolute inset-0 rounded-sm bg-surface shadow-card"
                      />
                    )}
                    <Link
                      href={hrefFor({ tab: t.value })}
                      scroll={false}
                      replace
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-10 items-center gap-1.5 rounded-sm px-3 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground md:h-8",
                        active && "text-foreground",
                      )}
                    >
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

        <div className="relative w-full md:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={tab === "saved" ? "Search saved articles" : "Search news"}
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

      <FeedGrid
        key={`${tab}:${tab === "saved" ? "" : q}`}
        tab={tab}
        q={q}
        onClear={() => setText("")}
        onRefresh={() => refresh.mutate()}
        refreshing={refresh.isPending}
      />
    </>
  );
};

type GridProps = { tab: NewsTab; q: string; onClear: () => void; onRefresh: () => void; refreshing: boolean };

const FeedGrid = ({ tab, q, onClear, onRefresh, refreshing }: GridProps) => {
  // Saved has no server-side search: fetch it unfiltered and filter here.
  const feed = useNewsFeed({ tab, q: tab === "saved" ? "" : q });
  const items = useMemo(() => {
    const all = feed.data?.pages.flatMap((p) => p.items) ?? [];
    if (tab !== "saved" || !q) return all;
    const needle = q.toLowerCase();
    return all.filter((n) => `${n.title} ${n.summary} ${n.source}`.toLowerCase().includes(needle));
  }, [feed.data, tab, q]);
  const total = feed.data?.pages[0]?.total ?? 0;

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
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (feed.isPending) return <CardGridSkeleton count={6} className="gap-[18px] md:grid-cols-2 lg:grid-cols-3" />;
  if (feed.isError) return <ErrorState error={feed.error} onRetry={() => feed.refetch()} title="Couldn't load the news" />;

  if (!items.length) {
    if (q)
      return (
        <EmptyState
          icon={SearchX}
          title={`No articles match “${q}”`}
          description="Try a shorter search or another category."
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
          title="No saved articles yet"
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
        description="Pull the latest stories from the feeds Mandy follows."
        action={
          <Button onClick={onRefresh} disabled={refreshing}>
            <RefreshCw data-icon="inline-start" className={cn(refreshing && "animate-spin")} aria-hidden />
            Refresh feeds
          </Button>
        }
      />
    );
  }

  return (
    <section aria-label="Articles">
      <p className="sr-only" aria-live="polite">
        Showing {items.length} of {total} articles
      </p>
      <ul className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial>
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: duration.slow, ease: easeOut, delay: (i % NEWS_PAGE_SIZE) * 0.04 }}
              className="min-w-0"
            >
              <NewsCard item={item} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div ref={sentinel} className="mt-8 flex flex-col items-center gap-2">
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
          items.length > NEWS_PAGE_SIZE && <p className="text-xs text-muted-foreground">You&apos;re all caught up.</p>
        )}
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {items.length} of {tab === "saved" && q ? items.length : total}
        </p>
      </div>
    </section>
  );
};

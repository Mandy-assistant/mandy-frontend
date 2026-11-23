"use client";

import { Briefcase, Loader2, RefreshCw, Search, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { InterestsEditor } from "@/features/interests/components/InterestsEditor";
import { useInterests } from "@/features/interests/hooks";
import { JobsTabs } from "@/features/jobs/components/JobsTabs";
import { ResponsiveDialog } from "@/features/profile/components/ResponsiveDialog";
import { cn } from "@/utils/cn";
import { useDiscover, useRefreshPostings } from "../hooks";
import type { RegionFilter } from "../types";
import { PostingCard } from "./PostingCard";

const REGIONS: { value: RegionFilter; label: string }[] = [
  { value: "mine", label: "My regions" },
  { value: "remote", label: "Remote" },
  { value: "india", label: "India" },
  { value: "anywhere", label: "Anywhere" },
];

const isRegion = (v: string | null): v is RegionFilter => REGIONS.some((r) => r.value === v);

/** Openings from public job boards, ranked for you, with the AI's fit check and one-tap tracking. */
export const DiscoverView = () => {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const regionParam = params.get("region");
  const region: RegionFilter = isRegion(regionParam) ? regionParam : "mine";
  const q = (params.get("q") ?? "").trim();
  const [text, setText] = useState(q);
  const [tuneOpen, setTuneOpen] = useState(false);
  const interests = useInterests();
  const refresh = useRefreshPostings();

  const go = (next: { region?: RegionFilter; q?: string }) => {
    const sp = new URLSearchParams(params.toString());
    const r = next.region ?? region;
    const query = next.q ?? q;
    if (r === "mine") sp.delete("region");
    else sp.set("region", r);
    if (query) sp.set("q", query);
    else sp.delete("q");
    const s = sp.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  useEffect(() => {
    const next = text.trim();
    if (next === q) return;
    const id = window.setTimeout(() => go({ q: next }), 350);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only typing restarts the timer
  }, [text]);

  useEffect(() => () => setTuneOpen(false), []);

  const myRegions = interests.data?.job_regions ?? [];
  const regionsHint =
    region === "mine" && myRegions.length === 0 ? "Showing every region. Set where you want to work to narrow it." : null;

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Openings from Remotive, RemoteOK, Jobicy, Himalayas, Arbeitnow and HN Who is hiring, ranked for you."
        actions={
          <Button variant="outline" onClick={() => refresh.mutate()} disabled={refresh.isPending} className="max-md:h-11">
            <RefreshCw data-icon="inline-start" className={cn(refresh.isPending && "animate-spin")} aria-hidden />
            {refresh.isPending ? "Pulling…" : "Pull new"}
          </Button>
        }
      />
      <JobsTabs active="discover" />

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center">
        <div role="group" aria-label="Region" className="-mx-4 scrollbar-none flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
          {REGIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={region === r.value}
              onClick={() => go({ region: r.value })}
              className={cn(
                "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition-colors",
                region === r.value ? "border-primary bg-primary text-primary-foreground" : "bg-surface hover:border-primary/40",
              )}
            >
              {r.label}
              {r.value === "mine" && myRegions.length > 0 && <span className="ml-1 opacity-80">({myRegions.join(", ")})</span>}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setTuneOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border bg-surface px-3.5 text-sm font-medium hover:border-primary/40"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden /> Tune
          </button>
        </div>
        <div className="relative md:ml-auto md:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search roles, stacks, companies"
            aria-label="Search openings"
            className="h-11 w-full rounded-full border bg-surface pr-10 pl-10 text-[15px] shadow-card outline-none placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary-soft md:h-10 md:text-sm [&::-webkit-search-cancel-button]:hidden"
          />
          {text && (
            <button
              type="button"
              onClick={() => setText("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-surface-2"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
      {regionsHint && <p className="-mt-2 mb-4 text-[13px] text-muted-foreground">{regionsHint}</p>}

      <Results
        key={`${region}:${q}`}
        region={region}
        q={q}
        onClear={() => setText("")}
        onPull={() => refresh.mutate()}
        pulling={refresh.isPending}
      />

      <ResponsiveDialog
        open={tuneOpen}
        onOpenChange={setTuneOpen}
        title="Tune your job picks"
        description="Regions, topics and what Mandy has learned."
      >
        {tuneOpen && <InterestsEditor />}
      </ResponsiveDialog>
    </>
  );
};

const Results = ({
  region,
  q,
  onClear,
  onPull,
  pulling,
}: {
  region: RegionFilter;
  q: string;
  onClear: () => void;
  onPull: () => void;
  pulling: boolean;
}) => {
  const query = useDiscover(region, q);
  const items = useMemo(() => {
    const all = query.data?.pages.flatMap((p) => p.items) ?? [];
    return [...new Map(all.map((p) => [p.id, p])).values()];
  }, [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;
  const personalizing = !!query.data?.pages[0]?.personalizing;

  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && !isFetchingNextPage && void fetchNextPage(), {
      rootMargin: "600px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (query.isPending)
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-52 rounded-2xl" />
        ))}
      </div>
    );
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} title="Couldn't load openings" />;
  if (!items.length)
    return q ? (
      <EmptyState
        icon={SearchX}
        title={`No openings match “${q}”`}
        description="Try another word, or widen the region."
        action={
          <Button variant="outline" onClick={onClear}>
            Clear search
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Briefcase}
        title="No openings yet"
        description="Mandy pulls the job boards on your first visit. Give it a minute, or pull now."
        action={
          <Button onClick={onPull} disabled={pulling}>
            <RefreshCw data-icon="inline-start" className={cn(pulling && "animate-spin")} aria-hidden />
            Pull openings
          </Button>
        }
      />
    );

  return (
    <section aria-label="Openings">
      <p className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground" aria-live="polite">
        {personalizing ? (
          <>
            <Loader2 className="size-3.5 animate-spin text-primary" aria-hidden /> Mandy is checking how well the top openings fit
            you…
          </>
        ) : (
          <>
            <Sparkles className="size-3.5 text-primary" aria-hidden /> {total} openings, best fit first
          </>
        )}
      </p>
      <ul className="grid gap-4 lg:grid-cols-2">
        {items.map((p) => (
          <li key={p.id} className="min-w-0">
            <PostingCard posting={p} />
          </li>
        ))}
      </ul>
      <div ref={sentinel} className="mt-8 flex justify-center">
        {hasNextPage ? (
          <Button
            variant="outline"
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="h-11 min-w-40"
          >
            {isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">That&apos;s everything for now.</p>
        )}
      </div>
    </section>
  );
};

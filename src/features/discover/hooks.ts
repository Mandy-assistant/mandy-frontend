"use client";

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData, type QueryKey } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { errorMessage } from "@/lib/api/errors";
import { jobKeys } from "@/features/jobs/keys";
import { discoverApi, type DiscoverPage } from "./api";
import type { Posting, RegionFilter } from "./types";

export const DISCOVER_PAGE_SIZE = 15;
const POLL_MS = 7000;

export const discoverKeys = {
  all: ["discover"] as const,
  list: (region: RegionFilter, q: string) => [...discoverKeys.all, region, q] as const,
};

type Data = InfiniteData<DiscoverPage, number>;

export const useDiscover = (region: RegionFilter, q: string) =>
  useInfiniteQuery({
    queryKey: discoverKeys.list(region, q),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      discoverApi.list(
        { page: pageParam, size: DISCOVER_PAGE_SIZE, region: region === "mine" ? undefined : region, q: q || undefined },
        signal,
      ),
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    refetchInterval: (query) => (query.state.data?.pages[0]?.personalizing && query.state.dataUpdateCount < 6 ? POLL_MS : false),
  });

const patch = (qc: ReturnType<typeof useQueryClient>, fn: (items: Posting[]) => Posting[]) => {
  const snapshot: [QueryKey, unknown][] = qc.getQueriesData({ queryKey: discoverKeys.all });
  qc.setQueriesData<Data>({ queryKey: discoverKeys.all }, (data) =>
    data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: fn(p.items) })) } : data,
  );
  return snapshot;
};

export const useTrackPosting = () => {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: (p: Posting) => discoverApi.track(p.id),
    meta: { silentError: true },
    onSuccess: (job, p) => {
      patch(qc, (items) => items.map((i) => (i.id === p.id ? { ...i, status: "tracked", job_id: job.id } : i)));
      qc.invalidateQueries({ queryKey: jobKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(`${p.role} added to your tracker`, {
        description: p.company,
        action: { label: "Open board", onClick: () => router.push("/jobs") },
      });
    },
    onError: (error) => toast.error("Couldn't add it to your tracker", { description: errorMessage(error) }),
  });
};

export const useHidePosting = () => {
  const qc = useQueryClient();
  const unhide = useMutation({
    mutationFn: (id: string) => discoverApi.unhide(id),
    onSettled: () => qc.invalidateQueries({ queryKey: discoverKeys.all }),
  });
  return useMutation({
    mutationFn: (p: Posting) => discoverApi.hide(p.id),
    meta: { silentError: true },
    onMutate: async (p) => {
      await qc.cancelQueries({ queryKey: discoverKeys.all });
      return { snapshot: patch(qc, (items) => items.filter((i) => i.id !== p.id)) };
    },
    onSuccess: (_d, p) =>
      toast("Hidden. Mandy will show fewer like it", {
        description: `${p.role} · ${p.company}`,
        action: { label: "Undo", onClick: () => unhide.mutate(p.id) },
      }),
    onError: (error, _p, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("Couldn't hide it", { description: errorMessage(error) });
    },
  });
};

export const useRefreshPostings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: discoverApi.refresh,
    onSuccess: ({ added }) => {
      toast.success(added ? `${added} new opening${added === 1 ? "" : "s"} pulled in` : "No new openings since the last pull");
      qc.invalidateQueries({ queryKey: discoverKeys.all });
    },
  });
};

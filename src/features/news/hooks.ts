"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { Page } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { interestKeys } from "@/features/interests/keys";
import { newsApi } from "./api";
import { newsKeys } from "./keys";
import type { NewsFeedParams, NewsItem } from "./types";

export const NEWS_PAGE_SIZE = 12;
/** While the AI writes "why it matters" notes, look again this often (a few times at most). */
const PERSONALIZING_POLL_MS = 6000;

type Feed = InfiniteData<Page<NewsItem> & { personalizing?: boolean }, number>;

export const useNewsFeed = ({ tab, q }: NewsFeedParams) =>
  useInfiniteQuery({
    queryKey: newsKeys.feed({ tab, q }),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }): Promise<Page<NewsItem> & { personalizing?: boolean }> => {
      const page = { page: pageParam, size: NEWS_PAGE_SIZE };
      if (tab === "saved") return newsApi.saved(page, signal);
      if (tab === "foryou" && !q) return newsApi.feed(page, signal);
      const category = tab === "foryou" || tab === "latest" ? undefined : tab;
      return newsApi.list({ ...page, category, q: q || undefined }, signal);
    },
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
    refetchInterval: (query) => {
      const first = query.state.data?.pages[0];
      return first?.personalizing && query.state.dataUpdateCount < 6 ? PERSONALIZING_POLL_MS : false;
    },
  });

/** Number on the "Saved" tab. */
export const useSavedNewsCount = () =>
  useQuery({
    queryKey: newsKeys.savedCount(),
    queryFn: ({ signal }) => newsApi.saved({ page: 1, size: 1 }, signal).then((p) => p.total),
    staleTime: 60_000,
  });

export const useNewsSources = () =>
  useQuery({ queryKey: newsKeys.sources(), queryFn: ({ signal }) => newsApi.sources(signal), staleTime: 5 * 60_000 });

/** A source's latest stories, for the full-screen story viewer. */
export const useSourceStories = (source: string | null) =>
  useQuery({
    queryKey: newsKeys.story(source ?? ""),
    queryFn: ({ signal }) => newsApi.list({ source: source!, page: 1, size: 10 }, signal).then((p) => p.items),
    enabled: !!source,
    staleTime: 5 * 60_000,
  });

type Snapshot = [QueryKey, unknown][];

/** Apply `patch` to one story everywhere it is cached: feeds, the story viewer, the daily brief. */
const patchEverywhere = async (qc: QueryClient, id: string, patch: (n: NewsItem) => NewsItem): Promise<Snapshot> => {
  await Promise.all([qc.cancelQueries({ queryKey: newsKeys.all }), qc.cancelQueries({ queryKey: ["dashboard"] })]);
  const snapshot: Snapshot = [
    ...qc.getQueriesData({ queryKey: newsKeys.all }),
    ...qc.getQueriesData({ queryKey: ["dashboard"] }),
  ];
  const one = (n: NewsItem) => (n.id === id ? patch(n) : n);
  qc.setQueriesData<Feed>({ queryKey: newsKeys.feeds() }, (data) =>
    data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map(one) })) } : data,
  );
  qc.setQueriesData<NewsItem[]>({ queryKey: [...newsKeys.all, "story"] }, (data) => data?.map(one));
  qc.setQueriesData<{ latest_news?: NewsItem[] }>({ queryKey: ["dashboard"] }, (data) =>
    data?.latest_news ? { ...data, latest_news: data.latest_news.map(one) } : data,
  );
  return snapshot;
};

const restore = (qc: QueryClient, snapshot?: Snapshot) => snapshot?.forEach(([key, data]) => qc.setQueryData(key, data));

/** Save / unsave, optimistic everywhere, rolled back with a toast if the server says no. */
export const useToggleNewsSave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }): Promise<{ is_saved: boolean }> =>
      save ? newsApi.save(id) : newsApi.unsave(id),
    meta: { silentError: true },
    onMutate: async ({ id, save }) => {
      const snapshot = await patchEverywhere(qc, id, (n) => ({ ...n, is_saved: save }));
      qc.setQueryData<number>(newsKeys.savedCount(), (n) => (n === undefined ? n : Math.max(0, n + (save ? 1 : -1))));
      return { snapshot };
    },
    onError: (error, { save }, ctx) => {
      restore(qc, ctx?.snapshot);
      toast.error(save ? "Couldn't save the article" : "Couldn't remove the bookmark", { description: errorMessage(error) });
    },
    onSettled: () => {
      // The Saved tab refetches next time it's opened; the card you just unsaved stays put so you can undo.
      qc.invalidateQueries({ queryKey: newsKeys.feed({ tab: "saved", q: "" }), refetchType: "none" });
      qc.invalidateQueries({ queryKey: newsKeys.savedCount(), refetchType: "none" });
      qc.invalidateQueries({ queryKey: interestKeys.all, refetchType: "none" });
    },
  });
};

export const useToggleNewsLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, like }: { id: string; like: boolean }): Promise<{ is_liked: boolean }> =>
      like ? newsApi.like(id) : newsApi.unlike(id),
    meta: { silentError: true },
    onMutate: async ({ id, like }) => ({ snapshot: await patchEverywhere(qc, id, (n) => ({ ...n, is_liked: like })) }),
    onError: (error, _vars, ctx) => {
      restore(qc, ctx?.snapshot);
      toast.error("Couldn't update the like", { description: errorMessage(error) });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: interestKeys.all, refetchType: "none" }),
  });
};

/** "Not interested": the story leaves your feeds at once, with an undo. Mandy learns from it. */
export const useHideNews = () => {
  const qc = useQueryClient();
  const unhide = useMutation({
    mutationFn: (id: string) => newsApi.unhide(id),
    onSettled: () => qc.invalidateQueries({ queryKey: newsKeys.feeds() }),
  });
  return useMutation({
    mutationFn: (item: NewsItem) => newsApi.hide(item.id),
    meta: { silentError: true },
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: newsKeys.feeds() });
      const snapshot: Snapshot = qc.getQueriesData({ queryKey: newsKeys.feeds() });
      qc.setQueriesData<Feed>({ queryKey: newsKeys.feeds() }, (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.filter((n) => n.id !== item.id) })) } : data,
      );
      return { snapshot };
    },
    onSuccess: (_d, item) =>
      toast("Got it, fewer stories like this", {
        description: item.title,
        action: { label: "Undo", onClick: () => unhide.mutate(item.id) },
      }),
    onError: (error, _item, ctx) => {
      restore(qc, ctx?.snapshot);
      toast.error("Couldn't hide the story", { description: errorMessage(error) });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: interestKeys.all, refetchType: "none" }),
  });
};

/** Fire-and-forget "you opened this" signal. */
export const useMarkOpened = () => useMutation({ mutationFn: (id: string) => newsApi.opened(id), meta: { silentError: true } });

export const useRefreshNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: newsApi.refresh,
    onSuccess: ({ added }) => {
      toast.success(added ? `${added} new stor${added === 1 ? "y" : "ies"} pulled in` : "You're up to date, nothing new yet");
      qc.invalidateQueries({ queryKey: newsKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Page } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { newsApi } from "./api";
import { newsKeys } from "./keys";
import type { NewsFeedParams, NewsItem } from "./types";

export const NEWS_PAGE_SIZE = 12;

type Feed = InfiniteData<Page<NewsItem>, number>;

export const useNewsFeed = ({ tab, q }: NewsFeedParams) =>
  useInfiniteQuery({
    queryKey: newsKeys.feed({ tab, q }),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      tab === "saved"
        ? newsApi.saved({ page: pageParam, size: NEWS_PAGE_SIZE }, signal)
        : newsApi.list(
            { category: tab === "all" ? undefined : tab, q: q || undefined, page: pageParam, size: NEWS_PAGE_SIZE },
            signal,
          ),
    getNextPageParam: (last) => (last.page < last.pages ? last.page + 1 : undefined),
  });

/** Number on the "Saved" tab. */
export const useSavedNewsCount = () =>
  useQuery({
    queryKey: newsKeys.savedCount(),
    queryFn: ({ signal }) => newsApi.saved({ page: 1, size: 1 }, signal).then((p) => p.total),
    staleTime: 60_000,
  });

const patchItem = (item: NewsItem, id: string, is_saved: boolean) => (item.id === id ? { ...item, is_saved } : item);

type Snapshot = [QueryKey, unknown][];

/**
 * Save / unsave with an optimistic update across every cached feed page (and the brief's
 * "For you" picks), rolled back with a toast if the server says no.
 */
export const useToggleNewsSave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }): Promise<{ is_saved: boolean }> =>
      save ? newsApi.save(id) : newsApi.unsave(id),
    meta: { silentError: true },
    onMutate: async ({ id, save }) => {
      await Promise.all([qc.cancelQueries({ queryKey: newsKeys.all }), qc.cancelQueries({ queryKey: ["dashboard"] })]);
      const snapshot: Snapshot = [
        ...qc.getQueriesData({ queryKey: newsKeys.all }),
        ...qc.getQueriesData({ queryKey: ["dashboard"] }),
      ];

      qc.setQueriesData<Feed>({ queryKey: newsKeys.feeds() }, (data) =>
        data ? { ...data, pages: data.pages.map((p) => ({ ...p, items: p.items.map((n) => patchItem(n, id, save)) })) } : data,
      );
      qc.setQueryData<number>(newsKeys.savedCount(), (n) => (n === undefined ? n : Math.max(0, n + (save ? 1 : -1))));
      qc.setQueriesData<{ latest_news?: NewsItem[] }>({ queryKey: ["dashboard"] }, (data) =>
        data?.latest_news ? { ...data, latest_news: data.latest_news.map((n) => patchItem(n, id, save)) } : data,
      );
      return { snapshot };
    },
    onError: (error, { save }, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(save ? "Couldn't save the article" : "Couldn't remove the bookmark", { description: errorMessage(error) });
    },
    onSettled: () => {
      // The Saved tab refetches next time it's opened; the card you just unsaved stays put so you can undo.
      qc.invalidateQueries({ queryKey: newsKeys.feed({ tab: "saved", q: "" }), refetchType: "none" });
      qc.invalidateQueries({ queryKey: newsKeys.savedCount(), refetchType: "none" });
    },
  });
};

export const useRefreshNews = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: newsApi.refresh,
    onSuccess: ({ added }) => {
      toast.success(added ? `${added} new article${added === 1 ? "" : "s"} pulled in` : "You're up to date — no new articles");
      qc.invalidateQueries({ queryKey: newsKeys.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

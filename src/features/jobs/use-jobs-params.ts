"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { isJobStatus, JOB_SORT_FIELDS, type JobSort, type JobStatus } from "./types";

export type JobsView = "board" | "table";

const isSort = (v: string | null): v is JobSort => !!v && (JOB_SORT_FIELDS as readonly string[]).includes(v.replace(/^-/, ""));

/** Jobs page state that lives in the URL: ?view=&q=&status=&sort=&page=&new= */
export const useJobsParams = () => {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = useMemo(() => {
    const status = params.get("status");
    const sort = params.get("sort");
    const page = Number(params.get("page"));
    return {
      view: (params.get("view") === "table" ? "table" : "board") as JobsView,
      q: params.get("q") ?? "",
      status: isJobStatus(status) ? status : undefined,
      sort: isSort(sort) ? sort : ("-updated_at" as JobSort),
      page: Number.isInteger(page) && page > 0 ? page : 1,
      isNew: params.get("new") === "1",
    };
  }, [params]);

  /** Merges `patch` into the URL (empty values are removed). Changing filters resets the page. */
  const update = useCallback(
    (patch: Partial<Record<"view" | "q" | "status" | "sort" | "page" | "new", string | number | null | undefined>>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      if (("q" in patch || "status" in patch || "sort" in patch) && !("page" in patch)) next.delete("page");
      if (next.get("view") === "board") next.delete("view");
      if (next.get("sort") === "-updated_at") next.delete("sort");
      if (next.get("page") === "1") next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return { ...state, update };
};

export type JobsFilter = { q: string; status?: JobStatus };

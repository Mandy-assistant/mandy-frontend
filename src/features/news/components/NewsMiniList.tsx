"use client";

import { ChevronRight } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";
import { timeAgo } from "../format";
import type { NewsItem } from "../types";
import { NewsCover } from "./NewsCover";

/** Compact list of news picks (the brief's "For you" card). Each row opens the article in a new tab. */
export const NewsMiniList = ({ items }: { items: NewsItem[] }) => {
  const hydrated = useHydrated();
  return (
    <ul className="flex flex-col gap-1">
      {items.map((n) => (
        <li key={n.id}>
          <a
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            className="-mx-2 flex min-h-11 items-center gap-3 rounded-lg p-2 transition-colors hover:bg-surface-2"
          >
            <NewsCover item={n} compact sizes="48px" className="size-12 shrink-0 rounded-[14px]" />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">
                {n.source}
                {hydrated && ` · ${timeAgo(n.published_at)}`}
              </span>
              <span className="line-clamp-2 font-medium">{n.title}</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  );
};

"use client";

import { ArrowUpRight } from "lucide-react";
import { categoryMeta } from "../categories";
import { timeAgo } from "../format";
import type { NewsItem } from "../types";
import { NewsCover } from "./NewsCover";
import { SaveButton } from "./SaveButton";

export const NewsCard = ({ item }: { item: NewsItem }) => (
  <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-card transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-pop motion-reduce:hover:translate-y-0">
    <NewsCover item={item} className="h-[132px] shrink-0" />
    <div className="flex flex-1 flex-col gap-2 px-[18px] pt-3 pb-[18px]">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          <span className="sr-only">{categoryMeta(item.category).label} · </span>
          {item.source} · <time dateTime={item.published_at}>{timeAgo(item.published_at)}</time>
        </p>
        <SaveButton item={item} className="-mr-2" />
      </div>
      <h3 className="text-base leading-snug font-semibold">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          {item.title}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </h3>
      {item.summary && <p className="line-clamp-2 text-[13px] text-muted-foreground">{item.summary}</p>}
      <span
        aria-hidden
        className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-medium text-primary-strong opacity-0 transition-opacity group-hover:opacity-100"
      >
        Read article <ArrowUpRight className="size-3.5" />
      </span>
    </div>
  </article>
);

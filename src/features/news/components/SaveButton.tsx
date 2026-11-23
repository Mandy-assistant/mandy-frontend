"use client";

import { Bookmark } from "lucide-react";
import { useAnimate, useReducedMotion } from "motion/react";
import { cn } from "@/utils/cn";
import { useToggleNewsSave } from "../hooks";
import type { NewsItem } from "../types";

/** Bookmark toggle with a springy pop. Saves optimistically. */
export const SaveButton = ({ item, className }: { item: Pick<NewsItem, "id" | "title" | "is_saved">; className?: string }) => {
  const toggle = useToggleNewsSave();
  const reduced = useReducedMotion();
  const [scope, animate] = useAnimate<HTMLButtonElement>();

  const onClick = () => {
    toggle.mutate({ id: item.id, save: !item.is_saved });
    if (!reduced && scope.current)
      animate(scope.current, { scale: [1, 1.35, 1] }, { duration: 0.35, ease: [0.34, 1.6, 0.64, 1] });
  };

  return (
    <button
      ref={scope}
      type="button"
      onClick={onClick}
      aria-pressed={item.is_saved}
      aria-label={item.is_saved ? `Remove “${item.title}” from saved` : `Save “${item.title}”`}
      className={cn(
        "relative z-10 grid size-11 shrink-0 place-items-center rounded-[10px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground md:size-9",
        item.is_saved && "text-primary hover:text-primary",
        className,
      )}
    >
      <Bookmark className={cn("size-[18px] transition-[fill]", item.is_saved && "fill-current")} aria-hidden />
    </button>
  );
};

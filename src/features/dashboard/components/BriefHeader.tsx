"use client";

import { Orb } from "@/components/shared/Orb";
import { greeting } from "@/lib/greeting";
import { buildBrief } from "../brief";
import type { DashboardSummary } from "../types";

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** Orb + "DAILY BRIEF · Friday, 20 Nov" + greeting + a sentence written from the summary. */
export const BriefHeader = ({ summary, now }: { summary: DashboardSummary; now: Date | null }) => {
  const name = firstName(summary.owner_name ?? "");
  return (
    <header className="flex items-start gap-3.5 sm:gap-5">
      <Orb size={64} className="hidden sm:block" />
      <Orb size={48} className="sm:hidden" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-primary-strong uppercase">
          Daily brief
          {now && ` · ${now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}`}
        </p>
        <h1 className="mt-1 mb-1.5 text-2xl font-bold sm:text-[28px]">
          {now ? greeting(now) : "Hello"}
          {name && `, ${name}`}
        </h1>
        <p className="max-w-[66ch] text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]" aria-live="polite">
          {now ? buildBrief(summary, now) : null}
        </p>
      </div>
    </header>
  );
};

export const BriefHeaderSkeleton = () => (
  <div aria-hidden className="flex items-start gap-3.5 sm:gap-5">
    <span className="size-12 shrink-0 shimmer rounded-full sm:size-16" />
    <div className="flex w-full max-w-xl flex-col gap-2.5">
      <span className="h-3 w-40 shimmer rounded-md" />
      <span className="h-8 w-64 shimmer rounded-md" />
      <span className="h-4 w-full shimmer rounded-md" />
      <span className="h-4 w-3/4 shimmer rounded-md" />
    </div>
  </div>
);

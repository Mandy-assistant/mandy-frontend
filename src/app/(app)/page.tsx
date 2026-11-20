import type { Metadata } from "next";
import { Suspense } from "react";
import { BentoSkeleton } from "@/features/dashboard/components/BentoSkeleton";
import { BriefHeaderSkeleton } from "@/features/dashboard/components/BriefHeader";
import { DailyBrief } from "@/features/dashboard/components/DailyBrief";

export const metadata: Metadata = { title: "Daily brief" };

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-[22px]">
          <BriefHeaderSkeleton />
          <div aria-hidden className="h-14 rounded-full border bg-surface shadow-card" />
          <BentoSkeleton />
        </div>
      }
    >
      <DailyBrief />
    </Suspense>
  );
}

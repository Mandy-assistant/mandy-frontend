import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeaderSkeleton } from "@/components/shared/skeletons";
import { DiscoverView } from "@/features/discover/components/DiscoverView";

export const metadata: Metadata = { title: "Discover jobs" };

export default function DiscoverJobsPage() {
  return (
    <Suspense fallback={<PageHeaderSkeleton />}>
      <DiscoverView />
    </Suspense>
  );
}

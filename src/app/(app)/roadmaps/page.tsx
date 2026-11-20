import type { Metadata } from "next";
import { Suspense } from "react";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/shared/skeletons";
import { RoadmapsView } from "@/features/roadmaps/components/RoadmapsView";

export const metadata: Metadata = { title: "Roadmaps" };

export default function RoadmapsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <CardGridSkeleton count={3} />
        </>
      }
    >
      <RoadmapsView />
    </Suspense>
  );
}

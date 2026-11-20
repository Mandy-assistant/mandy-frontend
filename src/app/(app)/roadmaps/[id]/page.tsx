import type { Metadata } from "next";
import { Suspense } from "react";
import { DetailSkeleton } from "@/components/shared/skeletons";
import { RoadmapDetailView } from "@/features/roadmaps/components/RoadmapDetailView";

export const metadata: Metadata = { title: "Roadmap" };

// The id is read on the client (useParams) under Suspense, so the shell stays static.
export default function RoadmapPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <RoadmapDetailView />
    </Suspense>
  );
}

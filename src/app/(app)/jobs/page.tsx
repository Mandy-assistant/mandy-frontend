import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeaderSkeleton } from "@/components/shared/skeletons";
import { BoardSkeleton } from "@/features/jobs/components/JobBoard";
import { JobsView } from "@/features/jobs/components/JobsView";

export const metadata: Metadata = { title: "Jobs" };

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <BoardSkeleton />
        </>
      }
    >
      <JobsView />
    </Suspense>
  );
}

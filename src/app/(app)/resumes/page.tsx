import type { Metadata } from "next";
import { Suspense } from "react";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/shared/skeletons";
import { ResumesView } from "@/features/resumes/components/ResumesView";

export const metadata: Metadata = { title: "Resumes" };

export default function ResumesPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <CardGridSkeleton count={3} />
        </>
      }
    >
      <ResumesView />
    </Suspense>
  );
}

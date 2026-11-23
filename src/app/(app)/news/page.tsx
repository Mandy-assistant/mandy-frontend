import type { Metadata } from "next";
import { Suspense } from "react";
import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/shared/skeletons";
import { NewsFeed } from "@/features/news/components/NewsFeed";

export const metadata: Metadata = { title: "Tech news" };

export default function NewsPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <CardGridSkeleton count={6} className="gap-[18px] md:grid-cols-2 lg:grid-cols-3" />
        </>
      }
    >
      <NewsFeed />
    </Suspense>
  );
}

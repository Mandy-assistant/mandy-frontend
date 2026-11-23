import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeaderSkeleton, ListSkeleton } from "@/components/shared/skeletons";
import { TasksView } from "@/features/tasks/components/TasksView";

export const metadata: Metadata = { title: "Tasks" };

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeaderSkeleton />
          <ListSkeleton rows={6} />
        </>
      }
    >
      <TasksView />
    </Suspense>
  );
}

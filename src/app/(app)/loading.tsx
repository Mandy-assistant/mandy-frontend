import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/shared/skeletons";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </>
  );
}

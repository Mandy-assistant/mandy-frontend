import { Shimmer } from "@/components/shared/skeletons";

export const BentoSkeleton = () => (
  <div role="status" aria-label="Loading your brief" className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3">
    <div className="flex h-[340px] flex-col gap-5 rounded-2xl bg-focus p-7 shadow-pop md:col-span-2">
      <span className="h-5 w-48 animate-pulse rounded-full bg-white/10" />
      <div className="flex flex-1 items-center gap-7">
        <div className="flex flex-1 flex-col gap-3">
          <span className="h-9 w-3/4 animate-pulse rounded-lg bg-white/10" />
          <span className="h-4 w-1/2 animate-pulse rounded-md bg-white/10" />
        </div>
        <span className="hidden size-[156px] animate-pulse rounded-full border-[10px] border-white/10 sm:block" />
      </div>
      <span className="h-11 animate-pulse rounded-2xl bg-white/6" />
    </div>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="flex h-[300px] flex-col gap-3 rounded-xl border bg-card p-[22px] shadow-card">
        <Shimmer className="h-5 w-28" />
        <Shimmer className="h-10 w-full" />
        <Shimmer className="h-10 w-full" />
        <Shimmer className="h-10 w-2/3" />
      </div>
    ))}
  </div>
);

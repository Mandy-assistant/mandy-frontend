import { cn } from "@/utils/cn";

export const Shimmer = ({ className }: { className?: string }) => <div aria-hidden className={cn("shimmer rounded-md", className)} />;

const Loading = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div role="status" aria-label="Loading" className={className}>
    {children}
  </div>
);

export const CardGridSkeleton = ({ count = 6, className }: { count?: number; className?: string }) => (
  <Loading className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-card">
        <Shimmer className="h-28 rounded-lg" />
        <Shimmer className="h-4 w-1/3" />
        <Shimmer className="h-5 w-4/5" />
        <Shimmer className="h-4 w-full" />
      </div>
    ))}
  </Loading>
);

export const ListSkeleton = ({ rows = 5, className }: { rows?: number; className?: string }) => (
  <Loading className={cn("flex flex-col gap-2", className)}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-3 rounded-md border bg-card px-4 py-3.5">
        <Shimmer className="size-5 rounded-md" />
        <Shimmer className="h-4 flex-1" />
        <Shimmer className="h-4 w-16" />
      </div>
    ))}
  </Loading>
);

export const TableSkeleton = ({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) => (
  <Loading className="overflow-hidden rounded-lg border bg-card">
    {Array.from({ length: rows + 1 }, (_, r) => (
      <div key={r} className="flex gap-4 border-b px-4 py-3.5 last:border-0">
        {Array.from({ length: cols }, (_, c) => (
          <Shimmer key={c} className={cn("h-4 flex-1", r === 0 && "h-3 opacity-60")} />
        ))}
      </div>
    ))}
  </Loading>
);

export const DetailSkeleton = () => (
  <Loading className="flex flex-col gap-6">
    <div className="flex items-center gap-5 rounded-2xl border bg-card p-6">
      <Shimmer className="size-24 rounded-full" />
      <div className="flex flex-1 flex-col gap-3">
        <Shimmer className="h-4 w-24" />
        <Shimmer className="h-7 w-2/3" />
        <Shimmer className="h-4 w-1/2" />
      </div>
    </div>
    <ListSkeleton rows={4} />
  </Loading>
);

export const PageHeaderSkeleton = () => (
  <div aria-hidden className="mb-6 flex flex-col gap-2">
    <Shimmer className="h-8 w-56" />
    <Shimmer className="h-4 w-80 max-w-full" />
  </div>
);

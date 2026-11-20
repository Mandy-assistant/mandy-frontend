import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  overline?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export const PageHeader = ({ title, description, overline, actions, className }: PageHeaderProps) => (
  <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
    <div className="min-w-0">
      {overline && <p className="mb-1 text-[11px] font-semibold tracking-[0.08em] text-primary-strong uppercase">{overline}</p>}
      <h1 className="text-2xl font-bold sm:text-[28px]">{title}</h1>
      {description && <p className="mt-1 text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);

/** Small uppercase label used above sections ("UP NEXT", "STATUS"). */
export const Overline = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase", className)}>{children}</p>
);

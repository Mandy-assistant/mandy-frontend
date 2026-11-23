import type { ReactNode } from "react";

export const ListHeader = ({ title, description, action }: { title: string; description?: string; action?: ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

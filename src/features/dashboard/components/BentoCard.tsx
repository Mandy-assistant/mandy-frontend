import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type Props = {
  title: ReactNode;
  href: string;
  linkLabel: string;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
};

/** White bento card with a heading and a link to its feature page. */
export const BentoCard = ({ title, href, linkLabel, meta, children, className, labelledBy }: Props) => (
  <article
    aria-labelledby={labelledBy}
    className={cn("flex h-full min-w-0 flex-col rounded-xl border bg-card p-[22px] shadow-card", className)}
  >
    <header className="mb-3.5 flex items-center justify-between gap-3">
      <h2 id={labelledBy} className="flex items-center gap-2 text-base font-semibold">
        {title}
      </h2>
      <Link
        href={href}
        className="-mr-2 inline-flex min-h-9 items-center gap-0.5 rounded-full px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        {meta ?? linkLabel}
        <ChevronRight className="size-3.5" aria-hidden />
        {meta && <span className="sr-only">, {linkLabel}</span>}
      </Link>
    </header>
    {children}
  </article>
);

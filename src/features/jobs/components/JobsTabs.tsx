"use client";

import { Compass, KanbanSquare } from "lucide-react";
import { LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { spring } from "@/lib/motion";
import { cn } from "@/utils/cn";

const TABS = [
  { value: "tracker", label: "My tracker", href: "/jobs", icon: KanbanSquare },
  { value: "discover", label: "Discover", href: "/jobs/discover", icon: Compass },
] as const;

/** Switch between your own job board and openings Mandy found for you. */
export const JobsTabs = ({ active }: { active: "tracker" | "discover" }) => (
  <LayoutGroup id="jobs-tabs">
    <nav aria-label="Jobs sections" className="mb-5">
      <ul className="inline-flex gap-1 rounded-full bg-surface-2 p-1">
        {TABS.map((t) => {
          const on = t.value === active;
          return (
            <li key={t.value} className="relative">
              {on && (
                <motion.span
                  layoutId="jobs-tab-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-full bg-surface shadow-card"
                />
              )}
              <Link
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  on && "text-foreground",
                )}
              >
                <t.icon className="size-4" aria-hidden />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  </LayoutGroup>
);

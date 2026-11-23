"use client";

import { MoreHorizontal } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { isActive, navItems } from "@/lib/nav";
import { cn } from "@/utils/cn";

const primary = navItems.filter((i) => i.mobile);
const rest = navItems.filter((i) => !i.mobile);

const Pill = ({ active, children }: { active: boolean; children: React.ReactNode }) => {
  const reduced = useReducedMotion();
  return (
    <span className="relative grid h-[30px] w-14 place-items-center">
      {active && (
        <motion.span
          layoutId="bottom-nav-active"
          className="absolute inset-0 rounded-full bg-primary-soft"
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <span className="relative">{children}</span>
    </span>
  );
};

/** Mobile (<768px) glass bottom nav: 4 main items + More. */
export const BottomNav = () => {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = rest.some((i) => isActive(pathname, i.href));

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-glass px-2 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden"
      >
        {primary.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn("flex min-h-11 min-w-15 flex-col items-center gap-0.5 text-[11px] font-medium", active ? "text-primary-strong" : "text-muted-foreground")}
            >
              <Pill active={active}>
                <item.icon className="size-5" aria-hidden />
              </Pill>
              {item.short}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className={cn("flex min-h-11 min-w-15 flex-col items-center gap-0.5 text-[11px] font-medium", moreActive ? "text-primary-strong" : "text-muted-foreground")}
        >
          <Pill active={moreActive}>
            <MoreHorizontal className="size-5" aria-hidden />
          </Pill>
          More
        </button>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(24px+env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <ul className="grid grid-cols-2 gap-2 px-4">
            {rest.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={isActive(pathname, item.href) ? "page" : undefined}
                  className="flex min-h-14 items-center gap-3 rounded-2xl border bg-surface px-4 font-medium aria-[current=page]:border-primary aria-[current=page]:bg-primary-soft aria-[current=page]:text-primary-strong"
                >
                  <item.icon className="size-5" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
};

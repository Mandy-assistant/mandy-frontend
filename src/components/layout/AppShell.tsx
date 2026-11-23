"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { PageTransition } from "@/components/motion";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const STORAGE_KEY = "mandy:sidebar-collapsed";

const readCollapsed = (): boolean => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) return saved === "1";
  } catch {
    /* storage blocked */
  }
  // Tablet (768–1023px) starts collapsed.
  return window.matchMedia("(max-width: 1023px)").matches;
};

export const AppShell = ({ children }: { children: ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from localStorage after hydration
    setCollapsed(readCollapsed());
  }, []);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {
        /* storage blocked */
      }
      return !c;
    });
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1600px] gap-2 px-4 pt-[env(safe-area-inset-top)] md:py-4">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      {/* usePathname() is only known at request time on dynamic routes ([id]), so each reader gets a boundary. */}
      <Suspense fallback={<div aria-hidden className={collapsed ? "hidden w-[72px] shrink-0 md:block" : "hidden w-[232px] shrink-0 md:block"} />}>
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </Suspense>
      <div className="min-w-0 flex-1 pb-[calc(92px+env(safe-area-inset-bottom))] md:px-6 md:pb-10">
        <Suspense fallback={<div aria-hidden className="mb-4 h-16 md:mb-2" />}>
          <Topbar />
        </Suspense>
        <main id="main" className="mx-auto w-full max-w-page">
          <Suspense fallback={children}>
            <PageTransition>{children}</PageTransition>
          </Suspense>
        </main>
      </div>
      <Suspense>
        <BottomNav />
      </Suspense>
      <CommandPalette />
    </div>
  );
};

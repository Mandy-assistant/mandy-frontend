"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Orb } from "@/components/shared/Orb";
import { titleFor } from "@/lib/nav";
import { setPaletteOpen } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export const Topbar = () => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 -mx-4 mb-4 flex h-16 items-center gap-3 bg-background/80 px-4 backdrop-blur-xl md:static md:mx-0 md:mb-2 md:bg-transparent md:px-0 md:backdrop-blur-none">
      <Link href="/" className="flex items-center gap-2.5 text-[17px] font-semibold md:hidden">
        <Orb size={30} />
        Mandy
      </Link>
      <p className="hidden truncate text-sm font-medium text-muted-foreground md:block">{titleFor(pathname)}</p>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="ml-auto flex h-10 items-center gap-2.5 rounded-full border bg-surface px-3 text-muted-foreground shadow-card transition hover:border-primary/40 hover:text-foreground sm:w-72 sm:px-4"
        aria-label="Search or ask Mandy (Command K)"
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="hidden flex-1 text-left text-sm sm:block">Search or ask Mandy…</span>
        <kbd className="hidden rounded-md bg-primary-soft px-1.5 py-0.5 font-mono text-[11px] text-primary-strong sm:block">⌘K</kbd>
      </button>
      <ThemeToggle />
      <UserMenu />
    </header>
  );
};

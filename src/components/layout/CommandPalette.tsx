"use client";

import { Briefcase, CheckSquare, Map, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { navItems } from "@/lib/nav";

// Tiny global store so the topbar search button and ⌘K share one palette.
let open = false;
const listeners = new Set<() => void>();
export const setPaletteOpen = (next: boolean) => {
  open = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/**
 * ⌘K / Ctrl+K: jump to any page, quick-create a task/job/roadmap, or ask Mandy.
 * Quick-create opens the feature page with `?new=1`; asking opens the brief with `?ask=<text>`.
 */
export const CommandPalette = () => {
  const router = useRouter();
  const isOpen = useSyncExternalStore(subscribe, () => open, () => false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const go = (href: string) => {
    setPaletteOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={setPaletteOpen} title="Command palette" description="Jump to a page, create something, or ask Mandy">
      <CommandInput placeholder="Search pages, create, or ask Mandy…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No matches. Press Enter on “Ask Mandy” to ask instead.</CommandEmpty>
        {query.trim() && (
          <CommandGroup heading="Assistant" forceMount>
            <CommandItem value={`ask ${query}`} forceMount onSelect={() => go(`/?ask=${encodeURIComponent(query.trim())}`)}>
              <Sparkles className="text-primary" />
              Ask Mandy “{query.trim()}”
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup heading="Create">
          <CommandItem value="new task create" onSelect={() => go("/tasks?new=1")}>
            <CheckSquare /> New task
          </CommandItem>
          <CommandItem value="new job add application" onSelect={() => go("/jobs?new=1")}>
            <Briefcase /> New job
          </CommandItem>
          <CommandItem value="new roadmap plan" onSelect={() => go("/roadmaps?new=1")}>
            <Map /> New roadmap
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Go to">
          {navItems.map((item) => (
            <CommandItem key={item.href} value={`${item.label} ${item.keywords?.join(" ") ?? ""}`} onSelect={() => go(item.href)}>
              <item.icon />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

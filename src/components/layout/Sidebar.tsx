"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Orb } from "@/components/shared/Orb";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { spring } from "@/lib/motion";
import { isActive, navItems } from "@/lib/nav";
import { cn } from "@/utils/cn";

type SidebarProps = { collapsed: boolean; onToggle: () => void };

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <nav
      aria-label="Main"
      className={cn(
        "sticky top-4 hidden h-[calc(100dvh-2rem)] shrink-0 flex-col gap-1 rounded-xl border bg-surface p-3 shadow-card transition-[width] duration-300 ease-out-expo md:flex",
        collapsed ? "w-[72px] items-center" : "w-[232px]",
      )}
    >
      <Link href="/" className={cn("mb-1 flex items-center gap-3 rounded-lg p-1.5", collapsed && "justify-center")}>
        <Orb size={collapsed ? 40 : 34} />
        {!collapsed && <span className="text-lg font-bold tracking-tight">Mandy</span>}
      </Link>
      <hr className={cn("my-2 border-border", collapsed ? "w-7" : "mx-2")} />

      <ul className={cn("flex flex-1 flex-col gap-1", collapsed && "items-center")}>
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-[14px] font-medium transition-colors",
                collapsed ? "size-12 justify-center" : "h-11 px-3.5",
                active ? "text-primary-strong" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-[14px] bg-primary-soft"
                  transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <item.icon className="relative size-[21px] shrink-0" aria-hidden />
              {collapsed ? <span className="sr-only">{item.label}</span> : <span className="relative truncate">{item.label}</span>}
            </Link>
          );
          return (
            <li key={item.href}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger render={link} />
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                link
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!collapsed}
        className={cn(
          "flex items-center gap-3 rounded-[14px] text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground",
          collapsed ? "size-12 justify-center" : "h-11 px-3.5",
        )}
      >
        <motion.span layout transition={spring}>
          {collapsed ? <PanelLeftOpen className="size-5" aria-hidden /> : <PanelLeftClose className="size-5" aria-hidden />}
        </motion.span>
        {!collapsed && <span className="text-sm font-medium">Collapse</span>}
      </button>
    </nav>
  );
};

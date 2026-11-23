"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { duration, easeOut } from "@/lib/motion";

type ItemCardProps = {
  monogram: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  label: string;
};

/** Experience / education card with layout animation and edit/delete actions. */
export const ItemCard = ({ monogram, title, subtitle, meta, badge, children, onEdit, onDelete, label }: ItemCardProps) => {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: duration.fast } }}
      transition={{ duration: duration.base, ease: easeOut }}
      className="group relative flex gap-4 rounded-xl border bg-card p-5 shadow-card transition-colors hover:border-primary/30"
    >
      <span
        aria-hidden
        className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-lg font-bold text-primary-strong ring-1 ring-primary/10"
      >
        {monogram}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] leading-snug font-semibold">{title}</h3>
            {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="-mt-1.5 -mr-2 size-10 rounded-xl text-muted-foreground md:size-9"
                  aria-label={`Actions for ${label}`}
                />
              }
            >
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <Trash2 /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {(meta || badge) && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {badge}
            {meta}
          </div>
        )}
        {children}
      </div>
    </motion.li>
  );
};

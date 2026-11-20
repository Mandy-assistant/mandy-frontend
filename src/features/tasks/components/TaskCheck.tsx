"use client";

import { motion, useReducedMotion } from "motion/react";
import { duration, easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";

type TaskCheckProps = {
  checked: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
};

/** Round-cornered checkbox whose tick draws in. 44px touch target on mobile, 20px visual box. */
export const TaskCheck = ({ checked, onToggle, label, disabled, className }: TaskCheckProps) => {
  const reduced = useReducedMotion();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "group/check -m-3 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full outline-none disabled:cursor-default sm:-m-2 sm:size-9",
        "focus-visible:[&>span]:ring-3 focus-visible:[&>span]:ring-ring/50",
        className,
      )}
    >
      <motion.span
        whileTap={reduced ? undefined : { scale: 0.85 }}
        className={cn(
          "grid size-5 place-items-center rounded-[6px] border-[1.5px] transition-colors duration-150",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input bg-surface group-hover/check:border-primary/60",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : duration.base, ease: easeOut, delay: checked && !reduced ? 0.05 : 0 }}
          />
        </svg>
      </motion.span>
    </button>
  );
};

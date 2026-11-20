"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { easeOut } from "@/lib/motion";
import { cn } from "@/utils/cn";

type ProgressRingProps = { value: number; size?: number; stroke?: number; className?: string; label?: string; children?: React.ReactNode };

/** Gradient progress ring; the arc animates to `value` (0-100). */
export const ProgressRing = ({ value, size = 110, stroke = 10, className, label, children }: ProgressRingProps) => {
  const reduced = useReducedMotion();
  const id = useId();
  const r = (size - stroke) / 2;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--cyan)" }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${id})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct / 100, opacity: pct > 0 ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.8, ease: easeOut }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        {children ?? (
          <span className="font-mono font-semibold tabular-nums" style={{ fontSize: Math.max(12, size * 0.2) }}>
            {pct}%
          </span>
        )}
      </span>
    </div>
  );
};

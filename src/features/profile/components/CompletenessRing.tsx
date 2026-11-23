"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { AnimatedNumber } from "@/components/motion";
import { easeOut } from "@/lib/motion";

/** Animated gradient ring for profile completeness (0–100). */
export const CompletenessRing = ({ value, size = 112 }: { value: number; size?: number }) => {
  const reduced = useReducedMotion();
  const gradient = useId();
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = 10;
  const r = 50 - stroke / 2;

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label="Profile completeness"
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--primary)" }} />
            <stop offset="100%" style={{ stopColor: "var(--cyan)" }} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${gradient})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct / 100 }}
          transition={{ duration: reduced ? 0 : 1, ease: easeOut, delay: 0.15 }}
          style={{ opacity: pct === 0 ? 0 : 1 }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="flex items-baseline font-mono text-2xl font-semibold tabular-nums">
          <AnimatedNumber value={pct} />
          <span className="text-sm text-muted-foreground">%</span>
        </span>
      </span>
    </div>
  );
};

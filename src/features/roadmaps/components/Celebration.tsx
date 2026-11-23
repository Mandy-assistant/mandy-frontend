"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/utils/cn";

const COLORS = ["bg-primary", "bg-cyan", "bg-success", "bg-status-interview", "bg-info", "bg-primary-strong"];
const COUNT = 28;

// Deterministic "random" spread so renders are pure.
const PARTICLES = Array.from({ length: COUNT }, (_, i) => {
  const angle = (i / COUNT) * Math.PI * 2 + ((i * 7) % 5) * 0.09;
  const distance = 120 + ((i * 37) % 110);
  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance * 0.75 - 20,
    rotate: ((i * 53) % 360) - 180,
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
    delay: (i % 4) * 0.02,
  };
});

/** A short confetti burst from the middle of the viewport (visible wherever the user scrolled). Renders nothing for reduced motion. */
export const Celebration = ({ burst }: { burst: number }) => {
  const reduced = useReducedMotion();
  if (!burst || reduced) return null;
  return (
    <div key={burst} aria-hidden className="pointer-events-none fixed top-[38%] left-1/2 z-50 size-0">
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          className={cn("absolute block", p.round ? "size-2.5 rounded-full" : "h-2 w-3 rounded-[2px]", p.color)}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 60], opacity: [1, 1, 0], scale: 1, rotate: p.rotate }}
          transition={{ duration: 1.1, delay: p.delay, ease: [0.2, 0.8, 0.4, 1], times: [0, 0.55, 1] }}
        />
      ))}
    </div>
  );
};

import type { Transition, Variants } from "motion/react";

/** Shared motion tokens (FE-04). Keep every animation under 400ms; only animate transform + opacity. */
export const duration = { fast: 0.15, base: 0.25, slow: 0.4 } as const;
export const easeOut = [0.22, 1, 0.36, 1] as const;
export const spring = { type: "spring", stiffness: 380, damping: 30 } as const satisfies Transition;
export const staggerStep = 0.04;

export const fadeUp = (reduced: boolean | null, distance = 16): Variants => ({
  hidden: { opacity: 0, y: reduced ? 0 : distance },
  show: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easeOut } },
});

export const pressable = (reduced: boolean | null) =>
  reduced ? {} : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.98 }, transition: spring };

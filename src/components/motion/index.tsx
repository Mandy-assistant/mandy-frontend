"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform, type HTMLMotionProps } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { duration, easeOut, fadeUp, pressable, staggerStep } from "@/lib/motion";

/** Fade + 8px slide-up whenever the route changes. */
export const PageTransition = ({ children, className }: { children: ReactNode; className?: string }) => {
  const pathname = usePathname();
  // Don't branch on useReducedMotion() for initial values: it's null on the server, which breaks hydration.
  // <MotionConfig reducedMotion="user"> (providers) skips the y movement for those users.
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.base, ease: easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

type StaggerProps = HTMLMotionProps<"div"> & { step?: number; delay?: number };

/** Children that are <StaggerItem> appear one after another. */
export const Stagger = ({ step = staggerStep, delay = 0, children, ...props }: StaggerProps) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{ hidden: {}, show: { transition: { staggerChildren: step, delayChildren: delay } } }}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ distance = 16, ...props }: HTMLMotionProps<"div"> & { distance?: number }) => (
  <motion.div variants={fadeUp(false, distance)} {...props} />
);

/** Card/button wrapper with hover lift and press feedback. */
export const Pressable = (props: HTMLMotionProps<"div">) => {
  const reduced = useReducedMotion();
  return <motion.div {...pressable(reduced)} {...props} />;
};

/** Counts up to `value` when it scrolls into view. */
export const AnimatedNumber = ({
  value,
  format = (n) => Math.round(n).toLocaleString(),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const mv = useMotionValue(0);
  const text = useTransform(mv, format);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.8, ease: easeOut });
    return () => controls.stop();
  }, [inView, value, reduced, mv]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
};

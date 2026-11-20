"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, Fingerprint } from "lucide-react";
import type { ReactNode } from "react";
import { Orb } from "@/components/shared/Orb";
import { easeOut, staggerStep } from "@/lib/motion";
import { cn } from "@/utils/cn";

export type PasskeyState = "ready" | "waiting" | "success" | "error";

/** Centered orb with three pulsing rings. Expands on success. */
export const OrbStage = ({ state }: { state: PasskeyState }) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="relative mb-2 grid size-[200px] place-items-center sm:size-[260px]"
      initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
      animate={{ opacity: 1, scale: state === "success" && !reduced ? 1.15 : 1 }}
      transition={{ duration: 0.6, ease: easeOut }}
    >
      {[0, 32, 60].map((inset, i) => (
        <motion.span
          key={inset}
          aria-hidden
          className="absolute rounded-full border border-stage-line"
          style={{ inset }}
          animate={reduced ? { opacity: 0.5 } : { scale: [1, 1.05, 1], opacity: [0.5, 0.25, 0.5] }}
          transition={{ duration: 3.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
        />
      ))}
      <Orb size={120} thinking={state === "waiting"} className="max-sm:[--orb-size:96px]!" />
    </motion.div>
  );
};

/** Rises children in one after another (y 16 → 0, 40ms apart). */
export const RiseIn = ({ children, index = 0, className }: { children: ReactNode; index?: number; className?: string }) => {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut, delay: 0.25 + index * staggerStep }}
    >
      {children}
    </motion.div>
  );
};

type PasskeyButtonProps = {
  state: PasskeyState;
  onClick: () => void;
  label: string;
  waitingLabel?: string;
  successLabel?: string;
  /** Changes every time an error happens, to replay the shake. */
  shakeKey?: number;
  disabled?: boolean;
  type?: "button" | "submit";
};

export const PasskeyButton = ({
  state,
  onClick,
  label,
  waitingLabel = "Waiting for your device",
  successLabel = "Welcome back",
  shakeKey = 0,
  disabled,
  type = "button",
}: PasskeyButtonProps) => {
  const reduced = useReducedMotion();
  return (
    <motion.button
      key={shakeKey}
      type={type}
      onClick={onClick}
      disabled={disabled || state === "waiting" || state === "success"}
      aria-busy={state === "waiting"}
      initial={false}
      animate={state === "error" && !reduced && shakeKey > 0 ? { x: [0, -8, 8, -4, 0] } : { x: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      whileHover={reduced || state !== "ready" ? undefined : { y: -1 }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      className={cn(
        "flex h-[60px] w-full items-center justify-center gap-3 rounded-[18px] text-base font-semibold text-white transition-[background,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-default",
        state === "waiting" && "bg-white/8",
        state === "success" && "bg-[#16a34a] shadow-[0_14px_36px_-8px_rgb(22_163_74/0.6)]",
        (state === "ready" || state === "error") && "bg-brand-gradient shadow-[0_14px_36px_-8px_rgb(124_92_255/0.6)] hover:shadow-[0_18px_44px_-8px_rgb(124_92_255/0.75)]",
      )}
    >
      {state === "waiting" ? (
        <span aria-hidden className="size-[22px] animate-spin rounded-full border-[2.5px] border-white/20 border-t-[#22d3ee]" />
      ) : state === "success" ? (
        <Check className="size-6" aria-hidden />
      ) : (
        <Fingerprint className="size-6" aria-hidden />
      )}
      <span>{state === "waiting" ? waitingLabel : state === "success" ? successLabel : label}</span>
    </motion.button>
  );
};

export const StatusLine = ({ message, error }: { message: string; error?: boolean }) => (
  <p aria-live="polite" className={cn("mt-3.5 min-h-[22px] text-center text-[13px]", error ? "text-[#f87171]" : "text-stage-muted")}>
    {message}
  </p>
);

export const darkInputClass =
  "h-12 w-full min-w-0 rounded-xl border border-stage-line bg-white/5 px-3.5 text-stage-foreground placeholder:text-stage-muted/70 outline-none transition focus:border-[#a895ff] focus:ring-4 focus:ring-[#7c5cff]/25";

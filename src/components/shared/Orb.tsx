import type { CSSProperties } from "react";
import { cn } from "@/utils/cn";

type OrbProps = { size?: number; thinking?: boolean; className?: string };

/** Mandy's gradient orb. `thinking` speeds up the inner swirl. */
export const Orb = ({ size = 40, thinking = false, className }: OrbProps) => (
  <span
    aria-hidden
    className={cn("orb", className)}
    style={{ "--orb-size": `${size}px`, "--orb-swirl": thinking ? "1.1s" : "7s" } as CSSProperties}
  />
);

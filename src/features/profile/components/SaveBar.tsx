"use client";

import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { duration, easeOut } from "@/lib/motion";

/** Floating "unsaved changes" bar for long forms. Sits above the mobile bottom nav. */
export const SaveBar = ({ visible, saving, onDiscard }: { visible: boolean; saving: boolean; onDiscard: () => void }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: duration.base, ease: easeOut }}
          className="sticky bottom-[calc(96px+env(safe-area-inset-bottom))] z-20 mt-5 md:bottom-4"
        >
          <div className="mx-auto flex max-w-xl items-center gap-3 rounded-2xl border bg-glass p-2 pl-4 shadow-pop backdrop-blur-xl">
            <span className="size-2 shrink-0 animate-pulse rounded-full bg-primary" aria-hidden />
            <p className="flex-1 text-sm font-medium" aria-live="polite">
              Unsaved changes
            </p>
            <Button type="button" variant="ghost" className="h-10" onClick={onDiscard} disabled={saving}>
              Discard
            </Button>
            <Button type="submit" className="h-10 px-5" disabled={saving}>
              {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

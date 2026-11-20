"use client";

import { formatDistanceToNow, format, parseISO } from "date-fns";
import { History, Loader2, RotateCcw, Save } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ListSkeleton } from "@/components/shared/skeletons";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { duration, easeOut } from "@/lib/motion";
import { useHydrated } from "@/lib/use-hydrated";
import { useRestoreVersion, useSaveVersion, useVersions } from "../hooks";
import type { Resume } from "../types";

type Props = {
  resumeId: string;
  currentVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Push pending autosave edits first, so the snapshot is up to date. */
  beforeSave: () => Promise<void>;
  onRestored: (resume: Resume) => void;
};

export const VersionHistory = ({ resumeId, currentVersion, open, onOpenChange, beforeSave, onRestored }: Props) => {
  const versions = useVersions(resumeId, open);
  const saveVersion = useSaveVersion(resumeId);
  const restore = useRestoreVersion(resumeId);
  const [confirm, setConfirm] = useState<number | null>(null);
  const hydrated = useHydrated();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
            <History className="size-5 text-primary-strong" aria-hidden /> Version history
          </SheetTitle>
          <SheetDescription>
            Save a snapshot before big changes. Restoring creates a new version, nothing is lost.
          </SheetDescription>
          <Button
            className="mt-3 h-11 w-full md:h-10"
            disabled={saveVersion.isPending}
            onClick={async () => {
              await beforeSave();
              saveVersion.mutate();
            }}
          >
            {saveVersion.isPending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Save data-icon="inline-start" />
            )}
            Save version
          </Button>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {versions.isPending ? (
            <ListSkeleton rows={4} />
          ) : versions.isError ? (
            <ErrorState error={versions.error} onRetry={() => versions.refetch()} title="Couldn't load versions" />
          ) : versions.data.length === 0 ? (
            <EmptyState compact icon={History} title="No versions yet" description="Save a version to get a restore point." />
          ) : (
            <ol className="relative flex flex-col gap-2.5 before:absolute before:top-4 before:bottom-4 before:left-[19px] before:w-px before:bg-border">
              <AnimatePresence initial={false}>
                {versions.data.map((v) => {
                  const latest = v.version === currentVersion;
                  return (
                    <motion.li
                      key={v.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: duration.base, ease: easeOut }}
                      className="relative flex items-center gap-3"
                    >
                      <span
                        className={
                          latest
                            ? "relative z-1 grid size-10 shrink-0 place-items-center rounded-full bg-brand-gradient font-mono text-xs font-semibold text-white shadow-glow"
                            : "relative z-1 grid size-10 shrink-0 place-items-center rounded-full border bg-surface font-mono text-xs font-semibold text-muted-foreground"
                        }
                      >
                        v{v.version}
                      </span>
                      <div className="min-w-0 flex-1 rounded-2xl border bg-card px-3.5 py-2.5">
                        <p className="text-sm font-medium">
                          {hydrated ? formatDistanceToNow(parseISO(v.created_at), { addSuffix: true }) : `Version ${v.version}`}
                          {latest && (
                            <span className="ml-2 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hydrated ? format(parseISO(v.created_at), "MMM d, yyyy · HH:mm") : v.created_at.slice(0, 10)} ·{" "}
                          {v.content?.sections?.filter((s) => s.visible).length ?? 0} sections
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl md:h-9"
                        disabled={latest || restore.isPending}
                        onClick={() => setConfirm(v.version)}
                      >
                        <RotateCcw data-icon="inline-start" /> Restore
                      </Button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ol>
          )}
        </div>
        <ConfirmDialog
          open={confirm !== null}
          onOpenChange={(o) => !o && setConfirm(null)}
          title={`Restore version ${confirm}?`}
          description="Your current content is replaced by this version. A new version is created, so you can always come back."
          confirmLabel="Restore"
          destructive={false}
          onConfirm={async () => {
            if (confirm === null) return;
            await beforeSave();
            const r = await restore.mutateAsync(confirm).catch(() => null);
            if (r) {
              onRestored(r);
              onOpenChange(false);
            }
          }}
        />
      </SheetContent>
    </Sheet>
  );
};

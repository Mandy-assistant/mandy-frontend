"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import type { Job, JobStatus } from "../types";
import { JobForm } from "./JobForm";

type JobFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: boolean;
  /** Present when editing. */
  job?: Job;
  defaultStatus?: JobStatus;
  onSaved?: (job: Job) => void;
};

/** Add / edit job: a dialog on desktop, a bottom drawer on phones. */
export const JobFormDialog = ({ open, onOpenChange, mobile, job, defaultStatus, onSaved }: JobFormDialogProps) => {
  const title = job ? "Edit job" : "Add a job";
  const description = job ? `${job.role} at ${job.company}` : "Track a role you're interested in or have applied to.";
  const form = (
    <JobForm
      key={job?.id ?? "new"}
      job={job}
      defaultStatus={defaultStatus}
      onCancel={() => onOpenChange(false)}
      onDone={(saved) => {
        onOpenChange(false);
        onSaved?.(saved);
      }}
    />
  );

  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="px-5 pt-2 pb-3">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          {form}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(860px,calc(100dvh-3rem))] flex-col gap-0 overflow-hidden rounded-xl p-0 shadow-pop sm:max-w-[620px]">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  );
};

"use client";

import { useState, type ReactElement } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ConfirmDialogProps = {
  /** Element that opens the dialog (rendered via base-ui `render`). */
  trigger?: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<unknown>;
};

/** Confirmation for destructive actions. Controlled (open/onOpenChange) or uncontrolled with a trigger. */
export const ConfirmDialog = ({
  trigger,
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  destructive = true,
  onConfirm,
}: ConfirmDialogProps) => {
  const [innerOpen, setInnerOpen] = useState(false);
  const isOpen = open ?? innerOpen;
  const setOpen = onOpenChange ?? setInnerOpen;

  return (
    <AlertDialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={destructive ? "destructive" : "default"}
            onClick={async () => {
              await onConfirm();
              setOpen(false);
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

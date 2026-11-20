"use client";

import { useSyncExternalStore, type FormEventHandler, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/utils/cn";

/** true when the media query matches (false on the server). */
export const useMediaQuery = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");

type ResponsiveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** When set, body + footer are wrapped in a <form>. */
  onSubmit?: FormEventHandler<HTMLFormElement>;
  className?: string;
};

/** Dialog on desktop, full-screen bottom drawer on phones. */
export const ResponsiveDialog = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSubmit,
  className,
}: ResponsiveDialogProps) => {
  const mobile = useIsMobile();

  const wrap = (body: ReactNode, foot: ReactNode, bodyClass: string) => {
    const inner = (
      <>
        <div className={bodyClass}>{body}</div>
        {foot}
      </>
    );
    return onSubmit ? (
      <form noValidate onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        {inner}
      </form>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col">{inner}</div>
    );
  };

  if (mobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
        <DrawerContent className="[--drawer-content-height:calc(100dvh-1rem)] data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-1rem)]">
          <DrawerHeader className="px-5 pt-3 group-data-[swipe-axis=y]/drawer-popup:text-left">
            <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
            {description && <DrawerDescription className="text-left">{description}</DrawerDescription>}
          </DrawerHeader>
          {wrap(
            children,
            footer && (
              <DrawerFooter className="flex-row border-t bg-surface px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] *:flex-1">
                {footer}
              </DrawerFooter>
            ),
            "min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4",
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("flex max-h-[min(92dvh,760px)] flex-col gap-0 p-0 sm:max-w-xl", className)}>
        <DialogHeader className="px-6 pt-6 pb-1">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {wrap(
          children,
          footer && <DialogFooter className="mx-0 mb-0 px-6 py-4">{footer}</DialogFooter>,
          "min-h-0 flex-1 overflow-y-auto px-6 py-5",
        )}
      </DialogContent>
    </Dialog>
  );
};

import type { Metadata } from "next";
import { ReloadButton } from "@/components/pwa/ReloadButton";

export const metadata: Metadata = { title: "Offline" };

/** Shown by the service worker when a page isn't cached and there's no connection. */
export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand-gradient text-2xl font-extrabold text-white shadow-pop">
          M
        </span>
        <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
        <p className="text-muted-foreground">
          Mandy needs a connection for fresh news, jobs and your data. Pages you opened recently still work.
        </p>
        <ReloadButton />
      </div>
    </main>
  );
}

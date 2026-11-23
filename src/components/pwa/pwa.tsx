"use client";

import { Download, Share, SquarePlus } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// The browser fires `beforeinstallprompt` once, early. Keep it in a tiny store so any screen can offer "Install".
let deferred: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

type InstallState = "installed" | "available" | "ios" | "unsupported";

const snapshot = (): InstallState => {
  if (installed || isStandalone()) return "installed";
  if (deferred) return "available";
  if (isIOS()) return "ios";
  return "unsupported";
};

export const useInstallState = () => useSyncExternalStore(subscribe, snapshot, () => "unsupported" as InstallState);

export const promptInstall = async () => {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  if (outcome === "accepted") installed = true;
  emit();
  return outcome === "accepted";
};

/**
 * Registers the service worker (production only, so dev never serves stale code), remembers the
 * install prompt, and offers a reload when a new version has been deployed.
 */
export const PwaProvider = () => {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred = e as InstallPromptEvent;
      emit();
    };
    const onInstalled = () => {
      installed = true;
      deferred = null;
      emit();
      toast.success("Mandy is installed", { description: "Open it from your home screen or dock." });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        window.location.reload();
      });
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          const offer = (worker: ServiceWorker) =>
            toast("A new version of Mandy is ready", {
              duration: Infinity,
              action: { label: "Reload", onClick: () => worker.postMessage("SKIP_WAITING") },
            });
          if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => {
              if (worker.state === "installed" && navigator.serviceWorker.controller) offer(worker);
            });
          });
          // Look for a new deploy when the app comes back to the foreground.
          document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && reg.update());
        })
        .catch(() => undefined);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
};

/** "Install Mandy" card for Settings: a real install button, or the iOS Share-sheet steps. */
export const InstallAppCard = () => {
  const state = useInstallState();
  if (state === "unsupported") return null;
  return (
    <section aria-labelledby="install-title" className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-lg font-extrabold text-white">
          M
        </span>
        <div>
          <h2 id="install-title" className="font-semibold">
            {state === "installed" ? "Mandy is installed" : "Install Mandy"}
          </h2>
          <p className="text-[13px] text-muted-foreground">
            {state === "installed"
              ? "You're using the app version. It opens full screen from your home screen or dock."
              : "Open it like an app: full screen, its own icon, faster to start."}
          </p>
        </div>
      </div>
      {state === "available" && (
        <Button onClick={() => void promptInstall()} className="self-start">
          <Download data-icon="inline-start" aria-hidden /> Install app
        </Button>
      )}
      {state === "ios" && (
        <ol className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            1. Tap <Share className="size-4 text-foreground" aria-label="Share" /> in Safari&apos;s toolbar
          </li>
          <li className="flex items-center gap-2">
            2. Choose <SquarePlus className="size-4 text-foreground" aria-hidden />{" "}
            <b className="text-foreground">Add to Home Screen</b>
          </li>
        </ol>
      )}
    </section>
  );
};

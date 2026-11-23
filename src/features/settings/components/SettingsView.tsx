"use client";

import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  Bot,
  Check,
  ExternalLink,
  Fingerprint,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Palette,
  Plus,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Orb } from "@/components/shared/Orb";
import { PageHeader } from "@/components/shared/PageHeader";
import { ListSkeleton, Shimmer } from "@/components/shared/skeletons";
import { ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { InstallAppCard } from "@/components/pwa/pwa";
import { RecoveryCodes } from "@/features/auth/components/RecoveryCodes";
import { InterestsEditor } from "@/features/interests/components/InterestsEditor";
import { useLock, usePasskeys } from "@/features/auth/hooks";
import type { Passkey } from "@/features/auth/api";
import { supportsPasskeys } from "@/features/auth/passkey";
import { SectionCard } from "@/features/profile/components/form-kit";
import { ResponsiveDialog } from "@/features/profile/components/ResponsiveDialog";
import { duration, easeOut } from "@/lib/motion";
import { useHydrated } from "@/lib/use-hydrated";
import { cn } from "@/utils/cn";
import { useAddPasskey, useAssistantStatus, useDeletePasskey, useRegenerateRecoveryCodes } from "../hooks";

const AI_KEY_URL = "https://aistudio.google.com/apikey";

const NAV = [
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "passkeys", label: "Passkeys", icon: Fingerprint },
  { id: "recovery", label: "Recovery codes", icon: KeyRound },
  { id: "interests", label: "Interests", icon: Sparkles },
  { id: "assistant", label: "Assistant", icon: Bot },
  { id: "app", label: "Install app", icon: Smartphone },
  { id: "lock", label: "Lock", icon: Lock },
] as const;

export const SettingsView = () => (
  <>
    <PageHeader overline="Settings" title="Settings" description="Appearance, security and Mandy's assistant." />
    <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="max-lg:hidden">
        <ul className="sticky top-4 flex flex-col gap-1">
          {NAV.map((n) => (
            <li key={n.id}>
              <a
                href={`#${n.id}`}
                className="flex h-10 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
              >
                <n.icon className="size-4" aria-hidden /> {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex min-w-0 flex-col gap-5">
        <Appearance />
        <Passkeys />
        <Recovery />
        <SectionCard
          id="interests"
          title="Interests"
          description="What ranks your news feed and job picks, and what the AI knows about you."
          icon={<Sparkles />}
        >
          <InterestsEditor />
        </SectionCard>
        <Assistant />
        <div id="app" className="scroll-mt-24">
          <InstallAppCard />
        </div>
        <LockCard />
      </div>
    </div>
  </>
);

/* ---------- Appearance ---------- */

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

/** Little window drawing. Paper-like, so palette colours rather than theme tokens. */
const ThemeArt = ({ mode }: { mode: "light" | "dark" | "system" }) => {
  const pane = (dark: boolean) => (
    <span className={cn("flex h-full flex-1 flex-col gap-1 p-1.5 sm:gap-1.5 sm:p-2.5", dark ? "bg-neutral-900" : "bg-white")}>
      <span className="flex gap-1">
        <span className="size-1.5 rounded-full bg-rose-400" />
        <span className="size-1.5 rounded-full bg-amber-400" />
        <span className="size-1.5 rounded-full bg-emerald-400" />
      </span>
      <span className="mt-1 h-2 w-3/4 rounded-full bg-linear-to-r from-violet-500 to-cyan-400" />
      <span className={cn("h-1.5 w-full rounded-full", dark ? "bg-neutral-700" : "bg-neutral-200")} />
      <span className={cn("h-1.5 w-2/3 rounded-full", dark ? "bg-neutral-700" : "bg-neutral-200")} />
      <span className={cn("mt-auto h-5 w-full rounded-md", dark ? "bg-neutral-800" : "bg-neutral-100")} />
    </span>
  );
  return (
    <span aria-hidden className="flex aspect-[4/3] w-full overflow-hidden rounded-xl ring-1 ring-black/10 sm:aspect-[16/10]">
      {mode === "system" ? (
        <>
          {pane(false)}
          {pane(true)}
        </>
      ) : (
        pane(mode === "dark")
      )}
    </span>
  );
};

const Appearance = () => {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const current = hydrated ? (theme ?? "system") : null;
  return (
    <SectionCard
      id="appearance"
      title="Appearance"
      description="Mandy follows your system unless you pick a theme."
      icon={<Palette />}
    >
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {THEMES.map((t) => {
          const on = current === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setTheme(t.value)}
              className={cn(
                "flex flex-col gap-2.5 rounded-2xl border-[1.5px] p-2 text-left transition-[border-color,background-color] sm:p-2.5",
                on ? "border-primary bg-primary-soft/50" : "border-border hover:border-primary/40",
              )}
            >
              <ThemeArt mode={t.value} />
              <span className="flex items-center gap-2 px-1 pb-0.5 text-sm font-medium">
                <t.icon className="size-4 text-muted-foreground max-sm:hidden" aria-hidden />
                <span className="flex-1">{t.label}</span>
                <span
                  aria-hidden
                  className={cn(
                    "grid size-5 place-items-center rounded-full border transition-colors",
                    on ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent",
                  )}
                >
                  <Check className="size-3" strokeWidth={3} />
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </SectionCard>
  );
};

/* ---------- Passkeys ---------- */

const deviceIcon = (name: string) =>
  /iphone|android|ipad|phone/i.test(name) ? Smartphone : /mac|windows|pc|laptop/i.test(name) ? Laptop : Fingerprint;

const Passkeys = () => {
  const passkeys = usePasskeys();
  const add = useAddPasskey();
  const remove = useDeletePasskey();
  const hydrated = useHydrated();
  const [removing, setRemoving] = useState<Passkey | null>(null);
  const supported = hydrated && supportsPasskeys();
  const list = passkeys.data ?? [];
  const onlyOne = list.length <= 1;

  return (
    <SectionCard
      id="passkeys"
      title="Passkeys"
      description="Unlock Mandy with Touch ID, Face ID or Windows Hello. Add one on each device you use."
      icon={<Fingerprint />}
      action={
        <Button
          onClick={() => add.mutate()}
          disabled={!supported || add.isPending}
          className="h-10"
          title={hydrated && !supported ? "This browser doesn't support passkeys" : undefined}
        >
          {add.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          {add.isPending ? "Waiting for device…" : "Add a passkey"}
        </Button>
      }
    >
      {passkeys.isPending ? (
        <ListSkeleton rows={2} />
      ) : passkeys.isError ? (
        <ErrorState error={passkeys.error} onRetry={() => passkeys.refetch()} title="Couldn't load passkeys" />
      ) : (
        <ul className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {list.map((pk) => {
              const Icon = deviceIcon(pk.device_name);
              return (
                <motion.li
                  key={pk.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: duration.base, ease: easeOut }}
                  className="flex items-center gap-3.5 rounded-2xl border bg-surface-2/40 p-3 pl-3.5"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary-strong">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{pk.device_name || "Passkey"}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {hydrated ? format(parseISO(pk.created_at), "MMM d, yyyy") : pk.created_at.slice(0, 10)}
                      <span aria-hidden> · </span>
                      {pk.last_used_at ? (
                        <>
                          Last used{" "}
                          {hydrated
                            ? formatDistanceToNow(parseISO(pk.last_used_at), { addSuffix: true })
                            : pk.last_used_at.slice(0, 10)}
                        </>
                      ) : (
                        "Never used"
                      )}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 rounded-xl text-muted-foreground hover:bg-destructive-soft hover:text-destructive md:size-10"
                    aria-label={
                      onlyOne ? `${pk.device_name} is your only passkey and can't be removed` : `Remove ${pk.device_name}`
                    }
                    title={onlyOne ? "Your only passkey can't be removed" : "Remove"}
                    disabled={onlyOne || remove.isPending}
                    onClick={() => setRemoving(pk)}
                  >
                    <Trash2 />
                  </Button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
      {onlyOne && list.length === 1 && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-success" aria-hidden /> Add a second passkey (e.g. on your phone) so you&apos;re
          never locked out.
        </p>
      )}
      <ConfirmDialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Remove “${removing?.device_name ?? ""}”?`}
        description="That device won't be able to unlock Mandy any more. You can add it again later."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removing) remove.mutate(removing.id);
        }}
      />
    </SectionCard>
  );
};

/* ---------- Recovery codes ---------- */

const Recovery = () => {
  const regen = useRegenerateRecoveryCodes();
  const [confirm, setConfirm] = useState(false);
  const [codes, setCodes] = useState<string[] | null>(null);

  return (
    <>
      <SectionCard
        id="recovery"
        title="Recovery codes"
        description="If you lose every device with a passkey, a recovery code lets you set up a new one. Each code works once."
        icon={<KeyRound />}
        action={
          <Button variant="outline" className="h-10" onClick={() => setConfirm(true)} disabled={regen.isPending}>
            {regen.isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
            Generate new codes
          </Button>
        }
      />
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Generate new recovery codes?"
        description="Your current codes stop working right away. Save the new ones somewhere safe."
        confirmLabel="Generate"
        onConfirm={async () => {
          const res = await regen.mutateAsync().catch(() => null);
          if (res) setCodes(res.recovery_codes);
        }}
      />
      <ResponsiveDialog
        open={!!codes}
        onOpenChange={(o) => !o && setCodes(null)}
        title="Your new recovery codes"
        description="This is the only time they're shown. Copy or download them now."
      >
        {codes && (
          <div className="flex flex-col gap-4">
            <RecoveryCodes codes={codes} tone="app" />
            <Button className="h-11 md:h-10" onClick={() => setCodes(null)}>
              I&apos;ve saved them
            </Button>
          </div>
        )}
      </ResponsiveDialog>
    </>
  );
};

/* ---------- Assistant ---------- */

const Assistant = () => {
  const status = useAssistantStatus();
  return (
    <SectionCard
      id="assistant"
      title="Assistant"
      description="Mandy uses Google Gemini for answers, resume rewrites and roadmap plans."
      icon={<Bot />}
    >
      {status.isPending ? (
        <Shimmer className="h-20 rounded-2xl" />
      ) : status.isError ? (
        <ErrorState error={status.error} onRetry={() => status.refetch()} title="Couldn't check the assistant" />
      ) : status.data.enabled ? (
        <div className="flex items-center gap-4 rounded-2xl border bg-surface-2/40 p-4">
          <Orb size={44} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              Gemini is connected
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
                <span className="size-1.5 rounded-full bg-current" aria-hidden /> Online
              </span>
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Model <span className="font-mono text-foreground">{status.data.model}</span>
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-warning/30 bg-warning-soft/60 p-4">
          <div className="flex items-start gap-4">
            <Orb size={44} className="opacity-50 grayscale" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                Assistant is off
                <span className="rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning ring-1 ring-warning/30">
                  Not configured
                </span>
              </p>
              <ol className="mt-2 flex list-decimal flex-col gap-1 pl-4 text-sm text-muted-foreground marker:font-mono marker:text-foreground/60">
                <li>
                  Get a free API key from{" "}
                  <a
                    href={AI_KEY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary-strong hover:underline"
                  >
                    Google AI Studio <ExternalLink className="size-3" aria-hidden />
                  </a>
                </li>
                <li>
                  Add <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground">GEMINI_API_KEY=…</code>{" "}
                  to the backend&apos;s <code className="font-mono text-xs">.env</code>
                </li>
                <li>Restart the API, then refresh this page.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </SectionCard>
  );
};

/* ---------- Lock ---------- */

const LockCard = () => {
  const lock = useLock();
  return (
    <section
      id="lock"
      className="relative scroll-mt-24 overflow-hidden rounded-xl bg-focus p-5 text-focus-foreground shadow-card sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-brand-gradient opacity-30 blur-3xl"
      />
      <div className="relative flex flex-wrap items-center gap-4">
        <span className="grid size-11 place-items-center rounded-2xl bg-white/10">
          <Lock className="size-5" aria-hidden />
        </span>
        <div className="min-w-[200px] flex-1">
          <h2 className="font-semibold">Lock Mandy</h2>
          <p className="text-sm text-focus-muted">Ends this session. You&apos;ll need your passkey to get back in.</p>
        </div>
        <Button
          onClick={() => lock.mutate()}
          disabled={lock.isPending}
          className="h-11 bg-white px-5 text-neutral-900 shadow-none hover:bg-white/90 md:h-10"
        >
          {lock.isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
          Lock now
        </Button>
      </div>
    </section>
  );
};

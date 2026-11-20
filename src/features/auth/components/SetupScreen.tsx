"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { easeOut } from "@/lib/motion";
import { useHydrated } from "@/lib/use-hydrated";
import { authKeys, useAuthStatus } from "../hooks";
import { createOwnerPasskey, passkeyErrorMessage, supportsPasskeys } from "../passkey";
import { OrbStage, PasskeyButton, RiseIn, StatusLine, darkInputClass, type PasskeyState } from "./PasskeyStage";
import { RecoveryCodes } from "./RecoveryCodes";

const schema = z.object({
  display_name: z.string().trim().min(1, "Tell Mandy what to call you").max(80),
  email: z.email("Enter a valid email"),
});
type Values = z.infer<typeof schema>;

export const SetupScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const { data: status } = useAuthStatus();
  const [state, setState] = useState<PasskeyState>("ready");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { display_name: "", email: "" } });

  // Setup is first-run only.
  useEffect(() => {
    if (status?.setup_complete && !codes) router.replace("/unlock");
  }, [status, codes, router]);

  const onSubmit = form.handleSubmit(async (values) => {
    setState("waiting");
    setMessage("Confirm on your device…");
    try {
      const result = await createOwnerPasskey(values);
      queryClient.setQueryData(authKeys.me, result.user);
      setState("success");
      setMessage("Passkey created");
      setCodes(result.recovery_codes);
    } catch (error) {
      setState("error");
      setAttempt((n) => n + 1);
      setMessage(passkeyErrorMessage(error));
    }
  });

  const finish = () => {
    queryClient.invalidateQueries({ queryKey: authKeys.status });
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center text-center">
      <OrbStage state={state === "success" ? "ready" : state} />
      <AnimatePresence mode="wait" initial={false}>
        {!codes ? (
          <motion.form
            key="form"
            onSubmit={onSubmit}
            noValidate
            className="flex w-full flex-col items-center"
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: easeOut }}
          >
            <RiseIn index={0}>
              <h1 className="text-[clamp(30px,5.5vw,44px)] leading-[1.1] font-extrabold tracking-[-0.03em]">Meet Mandy</h1>
            </RiseIn>
            <RiseIn index={1}>
              <p className="mt-2.5 text-base text-stage-muted">Set up your passkey. No password, just your device.</p>
            </RiseIn>

            <RiseIn index={2} className="mt-7 flex w-full flex-col gap-3 text-left">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-stage-muted">Your name</span>
                <input {...form.register("display_name")} autoComplete="name" placeholder="Mathan" className={darkInputClass} aria-invalid={!!form.formState.errors.display_name} />
                {form.formState.errors.display_name && <span className="text-xs text-[#f87171]">{form.formState.errors.display_name.message}</span>}
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-stage-muted">Email</span>
                <input {...form.register("email")} type="email" autoComplete="email" placeholder="you@example.com" className={darkInputClass} aria-invalid={!!form.formState.errors.email} />
                {form.formState.errors.email && <span className="text-xs text-[#f87171]">{form.formState.errors.email.message}</span>}
              </label>
            </RiseIn>

            <RiseIn index={3} className="mt-6 w-full">
              {hydrated && !supportsPasskeys() ? (
                <p role="alert" className="rounded-2xl border border-stage-line bg-white/5 p-4 text-sm text-stage-muted">
                  This browser doesn&apos;t support passkeys. Open Mandy in Safari, Chrome, Edge or Firefox to set it up.
                </p>
              ) : (
                <PasskeyButton type="submit" state={state} onClick={() => {}} label="Create passkey" successLabel="Passkey created" shakeKey={attempt} />
              )}
            </RiseIn>
            <StatusLine message={message} error={state === "error"} />
          </motion.form>
        ) : (
          <motion.section
            key="codes"
            className="flex w-full flex-col items-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
          >
            <h1 className="text-3xl font-extrabold tracking-[-0.03em]">Save your recovery codes</h1>
            <p className="mt-2 mb-6 text-stage-muted">
              If you lose this device, each code lets you in once. You won&apos;t see them again.
            </p>
            <RecoveryCodes codes={codes} />
            <label className="mt-5 flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="size-4 accent-[#7c5cff]" />
              I saved these codes somewhere safe
            </label>
            <button
              type="button"
              disabled={!saved}
              onClick={finish}
              className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-[18px] bg-brand-gradient text-base font-semibold text-white shadow-[0_14px_36px_-8px_rgb(124_92_255/0.6)] transition disabled:opacity-40"
            >
              Open Mandy
              <ArrowRight className="size-5" aria-hidden />
            </button>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};

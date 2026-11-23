"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer } from "react";
import { greeting } from "@/lib/greeting";
import { useHydrated } from "@/lib/use-hydrated";
import { authKeys, useAuthStatus } from "../hooks";
import { deviceLabel, passkeyErrorMessage, supportsPasskeys, unlockWithPasskey } from "../passkey";
import { OrbStage, PasskeyButton, RiseIn, StatusLine, type PasskeyState } from "./PasskeyStage";

type State = { status: PasskeyState; message: string; attempt: number };
type Action = { type: "start" } | { type: "success" } | { type: "fail"; message: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "start":
      return { ...state, status: "waiting", message: "Confirm on your device…" };
    case "success":
      return { ...state, status: "success", message: "Unlocked" };
    case "fail":
      return { status: "error", message: action.message, attempt: state.attempt + 1 };
  }
};

const safeNext = (next: string | null) => (next?.startsWith("/") && !next.startsWith("//") ? next : "/");

export const UnlockScreen = () => {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const { data: status } = useAuthStatus();
  const [state, dispatch] = useReducer(reducer, { status: "ready", message: "", attempt: 0 });

  // First run: there is no owner passkey yet.
  useEffect(() => {
    if (status && !status.setup_complete) router.replace("/setup");
  }, [status, router]);

  const supported = hydrated && supportsPasskeys();
  const name = status?.owner_name?.split(" ")[0];

  const unlock = async () => {
    dispatch({ type: "start" });
    try {
      const { user } = await unlockWithPasskey();
      queryClient.setQueryData(authKeys.me, user);
      dispatch({ type: "success" });
      setTimeout(() => {
        router.replace(safeNext(params.get("next")));
        router.refresh();
      }, reduced ? 200 : 650);
    } catch (error) {
      dispatch({ type: "fail", message: passkeyErrorMessage(error) });
    }
  };

  return (
    <motion.div
      className="flex flex-col items-center text-center"
      animate={{ opacity: state.status === "success" ? 0 : 1 }}
      transition={{ duration: 0.5, delay: state.status === "success" ? 0.35 : 0 }}
    >
      <OrbStage state={state.status} />

      <RiseIn index={0}>
        <h1 className="text-[clamp(32px,6vw,48px)] leading-[1.1] font-extrabold tracking-[-0.03em]">
          {hydrated ? greeting() : "Welcome back"}
          {name ? `, ${name}` : ""}
        </h1>
      </RiseIn>
      <RiseIn index={1}>
        <p className="mt-2.5 text-base text-stage-muted">Your assistant is ready. Unlock with your device to continue.</p>
      </RiseIn>

      <RiseIn index={2} className="mt-8 w-full">
        {hydrated && !supported ? (
          <div role="alert" className="rounded-2xl border border-stage-line bg-white/5 p-4 text-sm text-stage-muted">
            This browser doesn&apos;t support passkeys. Use a recovery code, or open Mandy in Safari, Chrome, Edge or Firefox.
          </div>
        ) : (
          <PasskeyButton state={state.status} onClick={unlock} label={state.status === "error" ? "Try again" : "Unlock with passkey"} shakeKey={state.attempt} />
        )}
      </RiseIn>

      <StatusLine message={state.message} error={state.status === "error"} />

      <RiseIn index={3}>
        <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-stage-line bg-white/6 px-3.5 py-1.5 text-xs text-stage-muted">
          <Lock className="size-3.5 text-[#22c55e]" aria-hidden />
          {hydrated ? `This ${deviceLabel()}` : "This device"}
        </span>
      </RiseIn>
      <RiseIn index={4}>
        <Link href="/recover" className="mt-3.5 inline-block rounded-md px-2 py-1 font-medium text-[#a895ff] hover:text-white">
          Use a recovery code instead
        </Link>
      </RiseIn>
    </motion.div>
  );
};

"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authApi } from "../api";
import { authKeys } from "../hooks";
import { passkeyErrorMessage, registerPasskeyWithRecovery } from "../passkey";
import { OrbStage, PasskeyButton, RiseIn, StatusLine, darkInputClass, type PasskeyState } from "./PasskeyStage";

const CODE_RE = /^[A-Z0-9]{4}-?[A-Z0-9]{4}$/;

/** Formats as XXXX-XXXX while typing. */
const formatCode = (raw: string) => {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
};

export const RecoverScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [state, setState] = useState<PasskeyState>("ready");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    if (!CODE_RE.test(code)) {
      setState("error");
      setMessage("Recovery codes look like AB12-CD34. Check the code and try again.");
      return;
    }
    setChecking(true);
    setMessage("");
    try {
      const { recovery_token } = await authApi.recover(code);
      setToken(recovery_token);
      setState("ready");
      setMessage("Code accepted. Now create a passkey on this device.");
    } catch (error) {
      setState("error");
      setMessage(passkeyErrorMessage(error));
    } finally {
      setChecking(false);
    }
  };

  const register = async () => {
    if (!token) return;
    setState("waiting");
    setMessage("Confirm on your device…");
    try {
      const { user } = await registerPasskeyWithRecovery(token);
      queryClient.setQueryData(authKeys.me, user);
      setState("success");
      setMessage("New passkey saved");
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 650);
    } catch (error) {
      setState("error");
      setAttempt((n) => n + 1);
      setMessage(passkeyErrorMessage(error));
    }
  };

  return (
    <div className="flex flex-col items-center text-center">
      <OrbStage state={state} />
      <RiseIn index={0}>
        <h1 className="text-[clamp(30px,5.5vw,44px)] leading-[1.1] font-extrabold tracking-[-0.03em]">Recover access</h1>
      </RiseIn>
      <RiseIn index={1}>
        <p className="mt-2.5 text-base text-stage-muted">
          {token ? "Register a new passkey for this device." : "Enter one of the recovery codes you saved during setup."}
        </p>
      </RiseIn>

      <RiseIn index={2} className="mt-7 w-full">
        {!token ? (
          <form onSubmit={submitCode} className="flex w-full gap-2">
            <label htmlFor="recovery-code" className="sr-only">
              Recovery code
            </label>
            <input
              id="recovery-code"
              value={code}
              onChange={(e) => setCode(formatCode(e.target.value))}
              placeholder="XXXX-XXXX"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              autoFocus
              className={`${darkInputClass} flex-1 font-mono tracking-[0.12em] uppercase`}
            />
            <button
              type="submit"
              disabled={checking}
              className="h-12 rounded-xl bg-white/12 px-5 font-semibold text-stage-foreground transition hover:bg-white/18 disabled:opacity-50"
            >
              {checking ? "Checking…" : "Use code"}
            </button>
          </form>
        ) : (
          <PasskeyButton state={state} onClick={register} label="Create new passkey" successLabel="You're in" shakeKey={attempt} />
        )}
      </RiseIn>
      <StatusLine message={message} error={state === "error"} />

      <RiseIn index={3}>
        <Link href="/unlock" className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-[#a895ff] hover:text-white">
          <ArrowLeft className="size-4" aria-hidden />
          Back to unlock
        </Link>
      </RiseIn>
    </div>
  );
};

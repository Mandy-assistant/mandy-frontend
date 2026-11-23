"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils/cn";

/** The 8 one-time recovery codes, shown once, with Copy and Download. */
export const RecoveryCodes = ({ codes, tone = "stage" }: { codes: string[]; tone?: "stage" | "app" }) => {
  const [copied, setCopied] = useState(false);
  const text = codes.join("\n");

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const blob = new Blob([`Mandy recovery codes\nEach code works once.\n\n${text}\n`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "mandy-recovery-codes.txt" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const stage = tone === "stage";
  const btn = cn(
    "inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl font-medium transition",
    stage ? "bg-white/10 text-stage-foreground hover:bg-white/16" : "border bg-surface hover:bg-surface-2",
  );

  return (
    <div className="w-full">
      <ol
        aria-label="Recovery codes"
        className={cn(
          "grid grid-cols-2 gap-2 rounded-2xl p-4 font-mono text-[15px] tracking-[0.08em]",
          stage ? "border border-stage-line bg-white/5" : "border bg-surface-2",
        )}
      >
        {codes.map((code) => (
          <li key={code} className="text-center">
            {code}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={copy} className={btn}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={download} className={btn}>
          <Download className="size-4" aria-hidden />
          Download
        </button>
      </div>
    </div>
  );
};

import { cn } from "@/utils/cn";
import type { Template } from "../types";

/** Tiny abstract drawing of a template (paper, so palette colours, not theme tokens). */
export const TemplateThumb = ({ template, className }: { template: Template; className?: string }) => {
  const line = (w: string, extra = "") => (
    <span className={cn("block h-[3px] rounded-full bg-neutral-200", extra)} style={{ width: w }} />
  );
  return (
    <span
      aria-hidden
      className={cn(
        "flex aspect-[210/150] w-full flex-col gap-1.5 overflow-hidden rounded-lg bg-white p-3 ring-1 ring-black/5",
        className,
      )}
    >
      {template === "modern" ? (
        <>
          <span className="block h-1 w-6 rounded-full bg-linear-to-r from-violet-600 to-cyan-400" />
          <span className="block h-2 w-2/3 rounded-full bg-neutral-800" />
          <span className="block h-[3px] w-1/2 rounded-full bg-violet-400" />
          <span className="mt-1 flex items-center gap-1">
            <span className="block h-[3px] w-6 rounded-full bg-violet-500" />
            <span className="block h-px flex-1 bg-violet-200" />
          </span>
          {line("92%")}
          {line("80%")}
          <span className="mt-0.5 flex gap-1">
            <span className="h-1.5 w-5 rounded-sm bg-violet-100" />
            <span className="h-1.5 w-4 rounded-sm bg-violet-100" />
            <span className="h-1.5 w-6 rounded-sm bg-violet-100" />
          </span>
        </>
      ) : (
        <>
          <span className="mx-auto block h-2 w-1/2 rounded-full bg-neutral-800" />
          <span className="mx-auto block h-[3px] w-1/3 rounded-full bg-neutral-300" />
          <span className="mt-1 block h-[3px] w-8 rounded-full bg-neutral-700" />
          <span className="block h-px w-full bg-neutral-700" />
          {line("94%")}
          {line("86%")}
          {line("70%")}
        </>
      )}
    </span>
  );
};

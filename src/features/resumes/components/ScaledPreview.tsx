"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useHydrated } from "@/lib/use-hydrated";
import type { ResumeContent, Template } from "../types";
import { PAGE_HEIGHT, PAGE_WIDTH, ResumePreview } from "./ResumePreview";

const useSize = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0];
      setSize({ width: box?.inlineSize ?? el.offsetWidth, height: box?.blockSize ?? el.offsetHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
};

/** The A4 page scaled down to fit its column, with page-break guides. */
export const ScaledPreview = ({
  content,
  template,
  maxScale = 1,
}: {
  content: ResumeContent;
  template: Template;
  maxScale?: number;
}) => {
  const [outer, outerSize] = useSize<HTMLDivElement>();
  const [page, pageSize] = useSize<HTMLDivElement>();
  const scale = outerSize.width ? Math.min(maxScale, outerSize.width / PAGE_WIDTH) : 0;
  const pageHeight = Math.max(pageSize.height, PAGE_HEIGHT);
  const pages = Math.max(1, Math.ceil((pageHeight - 4) / PAGE_HEIGHT));

  return (
    <div ref={outer} className="w-full">
      <div className="relative mx-auto" style={{ width: PAGE_WIDTH * scale, height: pageHeight * scale, opacity: scale ? 1 : 0 }}>
        <div
          ref={page}
          className="absolute top-0 left-0 origin-top-left overflow-hidden rounded-[6px] shadow-pop ring-1 ring-black/5"
          style={{ transform: `scale(${scale})`, width: PAGE_WIDTH }}
        >
          <ResumePreview content={content} template={template} />
          {Array.from({ length: pages - 1 }, (_, i) => (
            <div
              key={i}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-violet-300"
              style={{ top: PAGE_HEIGHT * (i + 1) }}
            >
              <span className="absolute -top-3 right-3 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                Page {i + 2}
              </span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground" aria-live="polite">
        A4 · {pages} {pages === 1 ? "page" : "pages"}
        {pages > 1 && " · most recruiters prefer one"}
      </p>
    </div>
  );
};

const PRINT_CSS = `
@media screen { .resume-print-root { display: none !important; } }
@media print {
  @page { size: A4; margin: 12mm 0; }
  @page :first { margin-top: 0; }
  html, body { background: white !important; }
  body > *:not(.resume-print-root) { display: none !important; }
  .resume-print-root[data-print-root] { position: static !important; width: 210mm; }
  .resume-print-root .resume-page { width: 210mm !important; min-height: 0 !important; }
}`;

/**
 * Unscaled copy of the page, portaled to <body> with `data-print-root`, so window.print()
 * prints exactly the resume at A4 size, nothing clipped by the app layout or the scaled preview.
 */
export const PrintCopy = ({ content, template }: { content: ResumeContent; template: Template }) => {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return createPortal(
    <div data-print-root className="resume-print-root">
      <style>{PRINT_CSS}</style>
      <ResumePreview content={content} template={template} />
    </div>,
    document.body,
  );
};

import { Fragment, type ReactNode } from "react";

/**
 * Small, safe markdown renderer for assistant replies: paragraphs, line breaks, headings,
 * bullet/numbered lists, **bold**, *italic*, `code` and [links](https://…). No HTML is injected.
 */
export const Markdown = ({ text }: { text: string }) => {
  const blocks = parseBlocks(text);
  return (
    <div className="flex flex-col gap-2.5 text-[15px] leading-relaxed text-foreground">
      {blocks.map((b, i) => {
        if (b.type === "heading")
          return (
            <p key={i} className="pt-1 font-semibold">
              {inline(b.text)}
            </p>
          );
        if (b.type === "p")
          return (
            <p key={i}>
              {b.lines.map((line, j) => (
                <Fragment key={j}>
                  {j > 0 && <br />}
                  {inline(line)}
                </Fragment>
              ))}
            </p>
          );
        if (b.type === "ul")
          return (
            <ul key={i} className="flex flex-col gap-1.5">
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-2.5">
                  <span aria-hidden className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="min-w-0">{inline(it)}</span>
                </li>
              ))}
            </ul>
          );
        return (
          <ol key={i} className="flex flex-col gap-1.5">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-px grid size-5 shrink-0 place-items-center rounded-full bg-primary-soft font-mono text-[11px] text-primary-strong"
                >
                  {j + 1}
                </span>
                <span className="min-w-0">{inline(it)}</span>
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
};

type Block = { type: "p"; lines: string[] } | { type: "heading"; text: string } | { type: "ul" | "ol"; items: string[] };

const UL = /^\s*[-*•]\s+(.*)$/;
const OL = /^\s*\d+[.)]\s+(.*)$/;
const H = /^\s*#{1,6}\s+(.*)$/;

const parseBlocks = (text: string): Block[] => {
  const blocks: Block[] = [];
  const last = () => blocks[blocks.length - 1];
  let gap = true;
  for (const raw of text.replace(/\r\n/g, "\n").split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      gap = true;
      continue;
    }
    let m: RegExpExecArray | null;
    if ((m = H.exec(line))) blocks.push({ type: "heading", text: m[1] });
    else if ((m = UL.exec(line)) || (m = OL.exec(line))) {
      const type = UL.test(line) ? "ul" : "ol";
      const prev = last();
      if (prev?.type === type) prev.items.push(m[1]);
      else blocks.push({ type, items: [m[1]] });
    } else {
      const prev = last();
      if (!gap && prev?.type === "p") prev.lines.push(line.trim());
      else if (!gap && (prev?.type === "ul" || prev?.type === "ol")) prev.items[prev.items.length - 1] += ` ${line.trim()}`;
      else blocks.push({ type: "p", lines: [line.trim()] });
    }
    gap = false;
  }
  return blocks;
};

const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g;

const inline = (text: string): ReactNode[] =>
  text.split(TOKEN).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
    if (link) {
      const safe = /^https?:\/\//i.test(link[2]) ? link[2] : null;
      return safe ? (
        <a
          key={i}
          href={safe}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary-strong underline-offset-4 hover:underline"
        >
          {link[1]}
        </a>
      ) : (
        <Fragment key={i}>{link[1]}</Fragment>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });

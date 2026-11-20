import { Fragment, type ReactNode } from "react";
import { monthYear } from "@/features/profile/format";
import { cn } from "@/utils/cn";
import type { ResumeContent, Section, SectionItem, Template } from "../types";

/**
 * The A4 page. It is paper, so it uses the Tailwind palette (always light), not theme tokens.
 * Sized in px at 96dpi: 794 × 1123 = 210mm × 297mm.
 */
export const PAGE_WIDTH = 794;
export const PAGE_HEIGHT = 1123;

const range = (item: SectionItem) => {
  const from = monthYear(item.start_date);
  const to = monthYear(item.end_date);
  if (from && to) return `${from} – ${to}`;
  return from || to;
};

const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

type Styles = {
  root: string;
  sectionTitle: string;
  itemTitle: string;
  itemSub: string;
  date: string;
  body: string;
  bullet: string;
  chip: string;
};

const MODERN: Styles = {
  root: "font-sans text-neutral-800",
  sectionTitle:
    "mb-2.5 flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-violet-700 uppercase after:h-px after:flex-1 after:bg-violet-200",
  itemTitle: "text-[13.5px] font-semibold text-neutral-900",
  itemSub: "text-[12.5px] font-medium text-neutral-600",
  date: "shrink-0 text-[11.5px] font-medium text-neutral-500 tabular-nums",
  body: "text-[12.5px] leading-[1.55] text-neutral-700",
  bullet: "marker:text-violet-500",
  chip: "rounded-md bg-violet-50 px-1.5 py-0.5 text-[11.5px] font-medium text-violet-800",
};

const CLASSIC: Styles = {
  root: "font-serif text-neutral-900",
  sectionTitle: "mb-2.5 border-b border-neutral-800 pb-1 text-[12.5px] font-bold tracking-[0.18em] text-neutral-900 uppercase",
  itemTitle: "text-[14px] font-bold text-neutral-900",
  itemSub: "text-[13px] text-neutral-700 italic",
  date: "shrink-0 text-[12px] text-neutral-700",
  body: "text-[13px] leading-[1.5] text-neutral-800",
  bullet: "marker:text-neutral-700",
  chip: "",
};

const Header = ({ content, template }: { content: ResumeContent; template: Template }) => {
  const h = content.header;
  const contact = [h.email, h.phone, h.location, ...h.links.filter((l) => l.url).map((l) => prettyUrl(l.url))].filter(Boolean);
  if (template === "classic") {
    return (
      <header className="mb-6 text-center">
        <h1 className="text-[30px] leading-tight font-bold tracking-[0.06em] text-neutral-900 uppercase">
          {h.full_name || "Your Name"}
        </h1>
        {h.headline && <p className="mt-1 text-[14px] text-neutral-700 italic">{h.headline}</p>}
        {contact.length > 0 && (
          <p className="mt-2 text-[12px] text-neutral-700">
            {contact.map((c, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="mx-2 text-neutral-400">|</span>}
                {c}
              </Fragment>
            ))}
          </p>
        )}
      </header>
    );
  }
  return (
    <header className="mb-6">
      <div className="mb-5 h-1.5 w-16 rounded-full bg-linear-to-r from-violet-600 to-cyan-400" />
      <h1 className="text-[30px] leading-tight font-bold tracking-[-0.02em] text-neutral-950">{h.full_name || "Your Name"}</h1>
      {h.headline && <p className="mt-0.5 text-[14.5px] font-medium text-violet-700">{h.headline}</p>}
      {contact.length > 0 && (
        <p className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-neutral-600">
          {contact.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-3">
              {i > 0 && <span aria-hidden className="size-1 rounded-full bg-neutral-300" />}
              {c}
            </span>
          ))}
        </p>
      )}
    </header>
  );
};

const Bullets = ({ items, s }: { items?: string[]; s: Styles }) => {
  const list = (items ?? []).filter((b) => b.trim());
  if (!list.length) return null;
  return (
    <ul className={cn("mt-1 list-disc space-y-0.5 pl-4", s.body, s.bullet)}>
      {list.map((b, i) => (
        <li key={i} className="pl-0.5">
          {b}
        </li>
      ))}
    </ul>
  );
};

const Entry = ({ item, s, extra }: { item: SectionItem; s: Styles; extra?: ReactNode }) => {
  const sub = [item.subtitle, item.location].filter(Boolean).join(" · ");
  return (
    <div className="break-inside-avoid">
      <div className="flex items-baseline justify-between gap-4">
        <p className={s.itemTitle}>{item.title || "Untitled"}</p>
        <p className={s.date}>{range(item)}</p>
      </div>
      {sub && <p className={s.itemSub}>{sub}</p>}
      {extra}
      {item.description && <p className={cn("mt-1 whitespace-pre-line", s.body)}>{item.description}</p>}
      <Bullets items={item.bullets} s={s} />
    </div>
  );
};

const SectionBlock = ({ section, s, template }: { section: Section; s: Styles; template: Template }) => {
  const hasContent = section.type === "summary" ? !!section.text?.trim() : section.items.length > 0;
  if (!hasContent) return null;
  return (
    <section className="mb-5">
      <h2 className={cn(s.sectionTitle, "break-after-avoid")}>{section.title}</h2>
      {section.type === "summary" && <p className={cn("whitespace-pre-line", s.body)}>{section.text}</p>}
      {(section.type === "experience" || section.type === "education") && (
        <div className="flex flex-col gap-3.5">
          {section.items.map((it) => (
            <Entry key={it.id} item={it} s={s} />
          ))}
        </div>
      )}
      {section.type === "projects" && (
        <div className="flex flex-col gap-3.5">
          {section.items.map((it) => (
            <Entry
              key={it.id}
              item={{ ...it, subtitle: [it.subtitle, it.url && prettyUrl(it.url)].filter(Boolean).join(" · ") }}
              s={s}
              extra={
                (it.tags ?? []).length > 0 &&
                (template === "modern" ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {it.tags!.map((t) => (
                      <span key={t} className={s.chip}>
                        {t}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className={cn("mt-0.5", s.body)}>
                    <span className="font-semibold">Tech:</span> {it.tags!.join(", ")}
                  </p>
                ))
              }
            />
          ))}
        </div>
      )}
      {section.type === "skills" && (
        <div className="flex flex-col gap-1.5">
          {section.items.map((it) =>
            template === "modern" ? (
              <div key={it.id} className="flex break-inside-avoid gap-3">
                {it.title && <p className="w-28 shrink-0 pt-0.5 text-[12px] font-semibold text-neutral-900">{it.title}</p>}
                <div className="flex flex-wrap gap-1">
                  {(it.tags ?? []).map((t) => (
                    <span key={t} className={s.chip}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p key={it.id} className={s.body}>
                {it.title && <span className="font-bold">{it.title}: </span>}
                {(it.tags ?? []).join(", ")}
              </p>
            ),
          )}
        </div>
      )}
    </section>
  );
};

export const ResumePreview = ({
  content,
  template,
  className,
}: {
  content: ResumeContent;
  template: Template;
  className?: string;
}) => {
  const s = template === "classic" ? CLASSIC : MODERN;
  return (
    <article
      aria-label="Resume preview"
      className={cn("resume-page bg-white px-[60px] pt-[54px] pb-[48px] [print-color-adjust:exact]", s.root, className)}
      style={{ width: PAGE_WIDTH, minHeight: PAGE_HEIGHT }}
    >
      <Header content={content} template={template} />
      {content.sections
        .filter((sec) => sec.visible)
        .map((sec) => (
          <SectionBlock key={sec.id} section={sec} s={s} template={template} />
        ))}
    </article>
  );
};

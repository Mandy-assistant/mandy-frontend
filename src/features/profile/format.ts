import { differenceInMonths, format, isValid, parseISO } from "date-fns";

/** "2023-04-01" → "Apr 2023". Unknown formats pass through unchanged. */
export const monthYear = (value: string | null | undefined) => {
  if (!value) return "";
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return value;
  const d = parseISO(value.length === 7 ? `${value}-01` : value);
  return isValid(d) ? format(d, "MMM yyyy") : value;
};

export const dateRange = (start: string | null | undefined, end: string | null | undefined, current = false) => {
  const from = monthYear(start);
  const to = current ? "Present" : monthYear(end);
  if (!from && !to) return "";
  if (!to) return from;
  return `${from} – ${to}`;
};

/** "2 yrs 3 mos". Pass `now` from an effect/handler (never during prerender). */
export const durationLabel = (start: string, end: string | null, now: Date) => {
  const s = parseISO(start);
  const e = end ? parseISO(end) : now;
  if (!isValid(s) || !isValid(e)) return "";
  const months = Math.max(1, differenceInMonths(e, s) + 1);
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, m && `${m} mo${m > 1 ? "s" : ""}`].filter(Boolean).join(" ");
};

export const initials = (name: string | null | undefined) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "M";

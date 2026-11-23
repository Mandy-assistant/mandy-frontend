import { format, isValid, parseISO } from "date-fns";
import type { Job } from "./types";

export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD", "JPY"] as const;
export const DEFAULT_CURRENCY = "USD";

const formatters = new Map<string, Intl.NumberFormat>();
const moneyFormatter = (currency: string) => {
  let f = formatters.get(currency);
  if (!f) {
    try {
      f = new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
      });
    } catch {
      f = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
    }
    formatters.set(currency, f);
  }
  return f;
};

/** "$120K – $150K", "from ₹18L", "up to €55K" or null. */
export const formatSalary = (job: Pick<Job, "salary_min" | "salary_max" | "currency">) => {
  const { salary_min: min, salary_max: max } = job;
  if (min == null && max == null) return null;
  const f = moneyFormatter(job.currency || DEFAULT_CURRENCY);
  if (min != null && max != null) return min === max ? f.format(min) : `${f.format(min)} – ${f.format(max)}`;
  if (min != null) return `from ${f.format(min)}`;
  return `up to ${f.format(max!)}`;
};

const parse = (value: string | null | undefined) => {
  if (!value) return null;
  const d = parseISO(value);
  return isValid(d) ? d : null;
};

/** "Nov 4, 2026" for a YYYY-MM-DD date. */
export const formatDate = (value: string | null | undefined, pattern = "MMM d, yyyy") => {
  const d = parse(value);
  return d ? format(d, pattern) : null;
};

/** "Fri, Nov 21 · 11:00" in the browser's time zone. */
export const formatDateTime = (value: string | null | undefined) => {
  const d = parse(value);
  return d ? format(d, "EEE, MMM d · HH:mm") : null;
};

export const companyInitial = (company: string) => company.trim().charAt(0).toUpperCase() || "?";

/** Strips the protocol for display: "jobs.vercel.com/frontend". */
export const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

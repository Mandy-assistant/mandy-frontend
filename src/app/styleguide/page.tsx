import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Styleguide } from "./Styleguide";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

/** Dev-only reference of every token, primitive and motion pattern (FE-02, FE-04). */
export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Styleguide />;
}

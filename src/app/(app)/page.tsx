import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/PageHeader";

export const metadata: Metadata = { title: "Daily brief" };

// Placeholder: replaced by the Daily Brief (FE-06).
export default function HomePage() {
  return <PageHeader overline="Daily brief" title="Hello" />;
}

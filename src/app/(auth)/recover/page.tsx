import type { Metadata } from "next";
import { RecoverScreen } from "@/features/auth/components/RecoverScreen";

export const metadata: Metadata = { title: "Recover access" };

export default function RecoverPage() {
  return <RecoverScreen />;
}

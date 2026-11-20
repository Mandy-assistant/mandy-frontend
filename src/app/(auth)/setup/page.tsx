import type { Metadata } from "next";
import { SetupScreen } from "@/features/auth/components/SetupScreen";

export const metadata: Metadata = { title: "Set up" };

export default function SetupPage() {
  return <SetupScreen />;
}

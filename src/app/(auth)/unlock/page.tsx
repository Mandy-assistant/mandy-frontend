import type { Metadata } from "next";
import { Suspense } from "react";
import { UnlockScreen } from "@/features/auth/components/UnlockScreen";

export const metadata: Metadata = { title: "Unlock" };

export default function UnlockPage() {
  return (
    <Suspense>
      <UnlockScreen />
    </Suspense>
  );
}

"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authLabels, authRoutes } from "@/constants/auth";
import { useSignOut } from "@/hooks/useSignOut";

export const TopNavBar = () => {
  const signOut = useSignOut();

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-page items-center justify-between px-6">
        <Link href={authRoutes.home} className="text-base font-semibold text-heading">
          {authLabels.brandName}
        </Link>
        <Button variant="ghost" onClick={signOut}>
          <LogOut data-icon="inline-start" />
          {authLabels.signOut}
        </Button>
      </div>
    </header>
  );
};

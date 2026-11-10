"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader } from "@/components/atoms/Loader";
import { authRoutes } from "@/constants/auth";
import { useAccessToken } from "@/hooks/useAccessToken";

/** Renders children only when signed in; otherwise sends the user to /login. */
export const ProtectedGuard = ({ children }: { children: ReactNode }) => {
  const token = useAccessToken();
  const router = useRouter();

  useEffect(() => {
    if (token === null) router.replace(authRoutes.login);
  }, [token, router]);

  if (!token) return <Loader fullScreen />;
  return children;
};

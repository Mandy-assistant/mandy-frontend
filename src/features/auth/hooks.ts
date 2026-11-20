"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "./api";

export const authKeys = {
  status: ["auth", "status"] as const,
  me: ["auth", "me"] as const,
  passkeys: ["auth", "passkeys"] as const,
};

export const useAuthStatus = () =>
  useQuery({ queryKey: authKeys.status, queryFn: ({ signal }) => authApi.status(signal), staleTime: 60_000 });

export const useCurrentUser = () =>
  useQuery({ queryKey: authKeys.me, queryFn: ({ signal }) => authApi.me(signal), staleTime: 5 * 60_000 });

/** "Lock Mandy": ends the session, clears every cached query and returns to the unlock screen. */
export const useLock = () => {
  const queryClient = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: authApi.logout,
    meta: { silentError: true },
    onSettled: () => {
      queryClient.clear();
      router.replace("/unlock");
      router.refresh();
    },
  });
};

export const usePasskeys = () => useQuery({ queryKey: authKeys.passkeys, queryFn: ({ signal }) => authApi.passkeys(signal) });

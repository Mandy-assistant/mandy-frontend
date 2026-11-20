"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, type Passkey } from "@/features/auth/api";
import { authKeys } from "@/features/auth/hooks";
import { addPasskey, passkeyErrorMessage } from "@/features/auth/passkey";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { settingsApi } from "./api";

export const assistantKeys = { status: ["assistant", "status"] as const };

export const useAssistantStatus = () =>
  useQuery({ queryKey: assistantKeys.status, queryFn: ({ signal }) => settingsApi.assistantStatus(signal), staleTime: 60_000 });

export const useAddPasskey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => addPasskey(),
    meta: { silentError: true },
    onSuccess: (pk) => {
      qc.setQueryData<Passkey[]>(authKeys.passkeys, (list) => (list ? [...list, pk] : [pk]));
      toast.success(`Passkey added: ${pk.device_name}`);
    },
    onError: (error) => toast.error(passkeyErrorMessage(error)),
  });
};

/** Optimistic remove; the API refuses the last one (409 LAST_PASSKEY). */
export const useDeletePasskey = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authApi.deletePasskey(id),
    meta: { silentError: true },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: authKeys.passkeys });
      const previous = qc.getQueryData<Passkey[]>(authKeys.passkeys);
      qc.setQueryData<Passkey[]>(authKeys.passkeys, (list) => list?.filter((p) => p.id !== id));
      return { previous };
    },
    onError: (error, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(authKeys.passkeys, ctx.previous);
      toast.error(
        error instanceof ApiError && error.code === "LAST_PASSKEY"
          ? "You can't remove your last passkey. Add another one first."
          : errorMessage(error),
      );
    },
    onSuccess: () => toast.success("Passkey removed"),
    onSettled: () => qc.invalidateQueries({ queryKey: authKeys.passkeys }),
  });
};

export const useRegenerateRecoveryCodes = () =>
  useMutation({
    mutationFn: () => authApi.regenerateRecoveryCodes(),
    onSuccess: () => toast.success("New recovery codes generated. The old ones no longer work."),
  });

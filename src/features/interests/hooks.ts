"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { interestsApi } from "./api";
import { interestKeys } from "./keys";
import type { Interests, InterestsPatch } from "./types";

export const useInterests = (enabled = true) =>
  useQuery({ queryKey: interestKeys.all, queryFn: ({ signal }) => interestsApi.get(signal), enabled });

/** Follow / mute / regions. Optimistic; feeds re-rank afterwards. */
export const useUpdateInterests = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: InterestsPatch) => interestsApi.update(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: interestKeys.all });
      const before = qc.getQueryData<Interests>(interestKeys.all);
      if (before) qc.setQueryData<Interests>(interestKeys.all, { ...before, ...patch });
      return { before };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.before) qc.setQueryData(interestKeys.all, ctx.before);
    },
    onSuccess: (data) => qc.setQueryData(interestKeys.all, data),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["news", "feed"] });
      qc.invalidateQueries({ queryKey: ["discover"] });
    },
  });
};

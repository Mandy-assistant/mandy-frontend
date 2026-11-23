import { api } from "@/lib/api/client";
import type { Interests, InterestsPatch } from "./types";

export const interestsApi = {
  get: (signal?: AbortSignal) => api.get<Interests>("/interests", { signal }),
  update: (body: InterestsPatch) => api.put<Interests>("/interests", body),
};

import { useSyncExternalStore } from "react";
import { getAccessToken, subscribeAccessToken } from "@/utils/accessToken";

/** `undefined` while rendering on the server (unknown), then the token or `null` in the browser. */
export const useAccessToken = () =>
  useSyncExternalStore<string | null | undefined>(subscribeAccessToken, getAccessToken, () => undefined);

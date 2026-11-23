import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/browser";
import { api } from "@/lib/api/client";

export type User = { id: string; email: string; display_name: string; created_at: string };
export type Passkey = { id: string; device_name: string; transports: string[]; created_at: string; last_used_at: string | null };
export type AuthStatus = { setup_complete: boolean; owner_name: string | null; webauthn_rp_id: string };

type Flow<T> = { flow_id: string; options: T };
type RegFlow = Flow<PublicKeyCredentialCreationOptionsJSON>;
type LoginFlow = Flow<PublicKeyCredentialRequestOptionsJSON>;

// Auth endpoints never trigger the 401 → refresh → retry loop.
const noRefresh = { skipAuthRefresh: true } as const;

export const authApi = {
  status: (signal?: AbortSignal) => api.get<AuthStatus>("/auth/status", { signal, skipAuthRefresh: true }),
  me: (signal?: AbortSignal) => api.get<User>("/auth/me", { signal }),

  setupOptions: (body: { display_name: string; email: string }) => api.post<RegFlow>("/auth/setup/options", body, noRefresh),
  setupVerify: (body: { flow_id: string; credential: RegistrationResponseJSON; device_name?: string }) =>
    api.post<{ user: User; recovery_codes: string[] }>("/auth/setup/verify", body, noRefresh),

  loginOptions: () => api.post<LoginFlow>("/auth/login/options", undefined, noRefresh),
  loginVerify: (body: { flow_id: string; credential: AuthenticationResponseJSON }) =>
    api.post<{ user: User }>("/auth/login/verify", body, noRefresh),

  recover: (code: string) => api.post<{ recovery_token: string }>("/auth/recover", { code }, noRefresh),
  recoverOptions: (recovery_token: string) => api.post<RegFlow>("/auth/recover/options", { recovery_token }, noRefresh),
  recoverVerify: (body: { recovery_token: string; flow_id: string; credential: RegistrationResponseJSON; device_name?: string }) =>
    api.post<{ user: User }>("/auth/recover/verify", body, noRefresh),

  passkeys: (signal?: AbortSignal) => api.get<Passkey[]>("/auth/passkeys", { signal }),
  passkeyOptions: () => api.post<RegFlow>("/auth/passkeys/options"),
  passkeyVerify: (body: { flow_id: string; credential: RegistrationResponseJSON; device_name?: string }) =>
    api.post<Passkey>("/auth/passkeys/verify", body),
  deletePasskey: (id: string) => api.delete(`/auth/passkeys/${id}`),
  regenerateRecoveryCodes: () => api.post<{ recovery_codes: string[] }>("/auth/recovery-codes"),

  logout: () => api.post<void>("/auth/logout", undefined, noRefresh),
};

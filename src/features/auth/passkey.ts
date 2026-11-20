import { browserSupportsWebAuthn, startAuthentication, startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import { ApiError } from "@/lib/api/errors";
import { authApi } from "./api";

export const supportsPasskeys = () => typeof window !== "undefined" && browserSupportsWebAuthn();

/** "This Mac · Touch ID" style label for the device chip and the passkey name. */
export const deviceLabel = () => {
  if (typeof navigator === "undefined") return "This device";
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return "iPhone · Face ID";
  if (/iPad/.test(ua)) return "iPad · Touch ID";
  if (/Android/.test(ua)) return "Android · Fingerprint";
  if (/Windows/.test(ua)) return "Windows PC · Windows Hello";
  if (/Mac/.test(ua)) return "Mac · Touch ID";
  return "This device · Passkey";
};

/** Human copy for anything a passkey ceremony can throw. */
export const passkeyErrorMessage = (error: unknown) => {
  if (error instanceof WebAuthnError) {
    if (error.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") return "This device already has a Mandy passkey.";
    if (error.code === "ERROR_INVALID_RP_ID" || error.code === "ERROR_INVALID_DOMAIN")
      return "Passkeys only work on localhost or HTTPS with the configured domain.";
  }
  if (error instanceof Error && (error.name === "NotAllowedError" || error.name === "AbortError"))
    return "The request was cancelled or timed out. Try again.";
  if (error instanceof ApiError) {
    if (error.isNetworkError) return "Can't reach Mandy's server. Check that the API is running.";
    return error.message;
  }
  return "Couldn't verify the passkey. Try again or use a recovery code.";
};

export const unlockWithPasskey = async () => {
  const { flow_id, options } = await authApi.loginOptions();
  const credential = await startAuthentication({ optionsJSON: options });
  return authApi.loginVerify({ flow_id, credential });
};

export const createOwnerPasskey = async (body: { display_name: string; email: string }) => {
  const { flow_id, options } = await authApi.setupOptions(body);
  const credential = await startRegistration({ optionsJSON: options });
  return authApi.setupVerify({ flow_id, credential, device_name: deviceLabel() });
};

export const registerPasskeyWithRecovery = async (recovery_token: string) => {
  const { flow_id, options } = await authApi.recoverOptions(recovery_token);
  const credential = await startRegistration({ optionsJSON: options });
  return authApi.recoverVerify({ recovery_token, flow_id, credential, device_name: deviceLabel() });
};

export const addPasskey = async (device_name = deviceLabel()) => {
  const { flow_id, options } = await authApi.passkeyOptions();
  const credential = await startRegistration({ optionsJSON: options });
  return authApi.passkeyVerify({ flow_id, credential, device_name });
};

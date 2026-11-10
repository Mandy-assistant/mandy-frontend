// NEXT_PUBLIC_* values are inlined at build time, so they must be read with the literal name.
export const env = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080",
  useMockApi: process.env.NEXT_PUBLIC_USE_MOCK_API !== "false",
} as const;

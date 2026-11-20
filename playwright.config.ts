import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the real stack:
 *   1. backend: docker compose up -d && uv run fastapi dev app/main.py --port 8000  (ENV=dev, DEV_LOGIN_ENABLED=true)
 *   2. frontend: started here (or reused if already running on :3001)
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3001/styleguide",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

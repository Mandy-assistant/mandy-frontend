import { expect, test, type Page } from "@playwright/test";

/**
 * Critical flow against the real API (FE-19):
 * sign in → create a job → move it to Interview → create a task → complete it →
 * add a passkey (virtual authenticator) → lock → unlock with that passkey.
 *
 * Needs the backend on :8000 with ENV=dev and DEV_LOGIN_ENABLED=true, and seeded data.
 */

const unique = (label: string) => `${label} ${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Navigate and wait until the page's first API call answers, i.e. the client has hydrated. */
const gotoReady = async (page: Page, path: string, api: string) => {
  const ready = page.waitForResponse((r) => r.url().includes(`/api/v1${api}`) && r.request().method() === "GET" && r.ok());
  await page.goto(path);
  await ready;
};

const signIn = async (page: Page) => {
  const res = await page.request.post("/api/v1/auth/dev-login");
  expect(res.ok(), "dev-login must be enabled on the API (ENV=dev, DEV_LOGIN_ENABLED=true)").toBeTruthy();
};

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test("track a job from Saved to Interview", async ({ page }) => {
  const company = unique("E2E Labs");
  await gotoReady(page, "/jobs?new=1", "/jobs");
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Company").fill(company);
  await dialog.getByLabel("Role").fill("Frontend Engineer");
  await dialog.getByRole("button", { name: "Add job" }).click();
  await expect(dialog).toBeHidden();

  const card = page.getByRole("button", { name: new RegExp(`Frontend Engineer at ${company}`) });
  await expect(card).toBeVisible();
  await card.click();

  const sheet = page.getByRole("dialog");
  await sheet.getByRole("group", { name: "Move to status" }).getByRole("button", { name: "Interview" }).click();
  await expect(sheet.getByRole("group", { name: "Move to status" }).getByRole("button", { name: "Interview" })).toHaveAttribute("aria-pressed", "true");

  // Persisted: the API reports the new status.
  await expect
    .poll(async () => {
      const res = await page.request.get(`/api/v1/jobs?q=${encodeURIComponent(company)}`);
      const body = (await res.json()) as { items: { status: string }[] };
      return body.items[0]?.status;
    })
    .toBe("interview");
});

test("add a study task and complete it", async ({ page }) => {
  const taskTitle = unique("E2E task");
  if (process.env.E2E_DEBUG) page.on("response", (r) => r.url().includes("/api/v1/tasks") && console.log("API", r.status(), r.request().method(), r.url(), r.request().postData()));
  await gotoReady(page, "/tasks", "/tasks");
  const quickAdd = page.getByPlaceholder("Add a task, press Enter");
  await quickAdd.fill(taskTitle);
  await quickAdd.press("Enter");

  const complete = page.getByRole("checkbox", { name: `Complete “${taskTitle}”` });
  await expect(complete).toBeVisible();
  await complete.click();

  await expect
    .poll(async () => {
      const res = await page.request.get("/api/v1/tasks?filter=completed");
      const tasks = (await res.json()) as { title: string }[];
      return tasks.some((t) => t.title === taskTitle);
    })
    .toBe(true);
});

test("add a passkey, lock, and unlock with it", async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== "chromium", "Virtual authenticators need Chromium (CDP)");
  test.skip(testInfo.project.name === "mobile", "Covered once on desktop");

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true },
  });

  if (process.env.E2E_DEBUG) {
    page.on("framenavigated", (f) => f === page.mainFrame() && console.log("NAV", f.url()));
    page.on("response", (r) => r.url().includes("/api/v1/auth") && console.log("API", r.status(), r.request().method(), r.url()));
  }
  await page.goto("/settings");
  await page.getByRole("button", { name: "Add a passkey" }).click();
  await expect(page.getByText(/passkey added/i)).toBeVisible();

  // Lock from the account menu.
  await page.getByRole("button", { name: "Account menu" }).click();
  const unlockReady = page.waitForResponse((r) => r.url().endsWith("/api/v1/auth/status") && r.ok());
  await page.getByRole("menuitem", { name: "Lock Mandy" }).click();
  await expect(page).toHaveURL(/\/unlock$/);
  await unlockReady; // the screen is hydrated once it has asked for the auth status

  await page.getByRole("button", { name: "Unlock with passkey" }).click();
  await expect(page).toHaveURL("http://localhost:3001/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Good (morning|afternoon|evening)/);

  // Clean up the passkey so repeated runs don't pile them up.
  const list = (await (await page.request.get("/api/v1/auth/passkeys")).json()) as { id: string; device_name: string; created_at: string }[];
  const newest = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (newest && list.length > 1) await page.request.delete(`/api/v1/auth/passkeys/${newest.id}`);
});

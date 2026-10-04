import { defineConfig, devices } from "@playwright/test";

// Smoke tests for the web app. They run against the one real Supabase project
// (there is no staging database), so the default suite only reads: guest
// browsing, SEO endpoints, headers. Signed-in checks need a dedicated test
// account — see e2e/account.spec.ts.
//
//   npm run test:e2e                          # starts `npm run dev` if needed
//   E2E_BASE_URL=https://… npm run test:e2e   # against a deployment

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
// The installed Chrome by default (no browser download); set PW_BUNDLED=1 to
// use Playwright's own Chromium (`npx playwright install chromium`), e.g. in CI.
const channel = process.env.PW_BUNDLED ? undefined : "chrome";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // A dev server compiles each route on first hit; more workers just queue up
  // behind it and time out. A deployment can take more.
  workers: process.env.E2E_BASE_URL ? undefined : 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel, viewport: { width: 1440, height: 900 } },
    },
    {
      name: "phone",
      use: { ...devices["Pixel 7"], channel },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
});

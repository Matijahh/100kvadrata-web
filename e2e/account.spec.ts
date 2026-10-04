import { expect, open, test } from "./helpers";

// Signed-in checks. They need a dedicated test account on the real project —
// never a personal one:
//
//   E2E_EMAIL=… E2E_PASSWORD=… npm run test:e2e
//
// They only read. Publishing a listing or sending a message would write to
// the production database, so those stay manual (see README).
const email = process.env.E2E_EMAIL;
const password = process.env.E2E_PASSWORD;

test.describe("signed in", () => {
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD (a dedicated test account) to run.");

  test.beforeEach(async ({ page }) => {
    await open(page, "/en/login?next=%2Fprofile");
    await page.getByLabel("Email:").fill(email!);
    await page.getByLabel("Password:").fill(password!);
    await page.getByRole("button", { name: "LOG IN" }).click();
    await expect(page).toHaveURL(/\/en\/profile/);
  });

  test("profile, inbox and notifications open", async ({ page }) => {
    await expect(page.getByRole("link", { name: /edit profile/i })).toBeVisible();

    await open(page, "/en/inbox");
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();

    await open(page, "/en/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  });
});

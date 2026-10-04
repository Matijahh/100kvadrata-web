import { devices } from "@playwright/test";
import { expect, open, test } from "./helpers";

// Signed out. The web app has no guest mode, so a visitor gets the website and
// the sign-in screens — and every app page sends them to login.
test.describe("signed out", () => {
  test("landing page links to both stores", async ({ page }) => {
    await open(page, "/en");
    await expect(page).toHaveTitle(/100m²/);
    await expect(page.locator('a[href*="apps.apple.com"]').first()).toBeAttached();
    await expect(page.locator('a[href*="play.google.com"]').first()).toBeAttached();
  });

  test("the website header leads to login", async ({ page }) => {
    await open(page, "/en");
    await page.locator(".account__login").click();
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test("\"Continue on web\" in the hero leads to login, then the app", async ({ page }) => {
    await open(page, "/en");
    await page.locator(".hero").getByRole("link", { name: "Continue on web" }).click();
    await expect(page).toHaveURL(/\/en\/login\?next=%2Ffeed$/);
  });

  for (const path of ["/feed", "/listing/1", "/user/00000000-0000-0000-0000-000000000000", "/inbox", "/profile", "/notifications"]) {
    test(`${path} needs an account`, async ({ page }) => {
      await open(page, `/en${path}`);
      await expect(page).toHaveURL(new RegExp(`/en/login\\?next=${encodeURIComponent(path)}$`));
      await expect(page.getByLabel("Email:")).toBeVisible();
    });
  }

  test("login and register offer no way in without an account", async ({ page }) => {
    for (const path of ["/en/login", "/en/register"]) {
      await open(page, path);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator('main a[href$="/feed"]')).toHaveCount(0);
      await expect(page.getByText(/without (an )?account|as a guest/i)).toHaveCount(0);
    }
  });

  test("the auth screens' logo leads back to the website", async ({ page }) => {
    await open(page, "/en/login");
    await page.getByRole("link", { name: "Website" }).click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test("phones are offered the app on the login screen, once", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "The prompt is for phones only.");
    // A fresh context, without the helper's dismissal.
    const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: testInfo.project.use.baseURL });
    const page = await context.newPage();
    await page.goto("/en/login", { waitUntil: "domcontentloaded" });
    const prompt = page.getByRole("dialog");
    await expect(prompt).toContainText("100m² feels best in the app");
    await prompt.getByRole("button", { name: "Continue on web" }).click();
    await expect(prompt).toBeHidden();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByLabel("Email:")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
    await context.close();
  });
});

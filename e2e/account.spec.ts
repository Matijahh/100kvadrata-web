import { expect, open, test } from "./helpers";

// Signed in — which, with no guest mode, is the whole web app. These need a
// dedicated test account on the real project, never a personal one:
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
    await open(page, "/en/login?next=%2Ffeed");
    await page.getByLabel("Email:").fill(email!);
    await page.getByLabel("Password:").fill(password!);
    await page.getByRole("button", { name: "LOG IN" }).click();
    await expect(page).toHaveURL(/\/en\/feed/);
  });

  test("the screen decides the layout: grid on desktop, reel on phones", async ({ page }, testInfo) => {
    const gridCard = page.locator('main a[href*="/listing/"]').first();
    const reelCard = page.locator("[data-reel-index='0']");

    if (testInfo.project.name === "phone") {
      await expect(reelCard).toBeVisible();
      await expect(gridCard).toHaveCount(0);
    } else {
      await expect(gridCard).toBeVisible();
      await expect(reelCard).toHaveCount(0);
    }
    // No switch to override it.
    await expect(page.getByRole("radio", { name: /^(Grid|Reel)$/ })).toHaveCount(0);
  });

  test("the filter panel collapses and stays as left", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "phone", "The panel is a wide-screen layout; phones get a sheet.");
    const toggle = page.getByRole("button", { name: "Filters" });
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Filters" })).toHaveAttribute("aria-expanded", "false");

    // Leave it open for the next run.
    await page.getByRole("button", { name: "Filters" }).click();
    await expect(page.getByRole("button", { name: "Filters" })).toHaveAttribute("aria-expanded", "true");
  });

  test("a filter narrows the feed and lights up the Filters button", async ({ page }, testInfo) => {
    await expect(page.locator("[data-reel-index='0'], main a[href*='/listing/']").first()).toBeVisible();
    // No free-text search (as in the app): the filters do the narrowing.
    await expect(page.getByRole("searchbox")).toHaveCount(0);

    // Desktop: the panel is open beside the grid. Phones: Filters opens a sheet.
    if (testInfo.project.name === "phone") await page.getByRole("button", { name: "Filters" }).click();
    const filters = testInfo.project.name === "phone" ? page.getByRole("dialog") : page.locator("main aside");

    await filters.getByRole("radio", { name: "For Sale" }).click();
    await filters.getByRole("button", { name: "SEARCH" }).click();

    // No chips row above the feed: the Filters button carries the count
    // (filled on phones), and the panel / sheet is where filters are seen
    // and cleared.
    const toggle = page.getByRole("button", { name: "Filters (1)" });
    await expect(toggle).toBeVisible();
    await expect(page.locator("main header li")).toHaveCount(0);
    if (testInfo.project.name === "phone") await toggle.click();
    await (testInfo.project.name === "phone" ? page.getByRole("dialog") : page.locator("main aside"))
      .getByRole("button", { name: "Clear all" })
      .click();
    await expect(page.getByRole("button", { name: "Filters", exact: true })).toBeVisible();
  });

  test("listing pages render with their metadata, and missing ones 404", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "phone", "Reads a card link from the desktop grid.");
    const href = await page.locator('main a[href*="/listing/"]').first().getAttribute("href");
    expect(href).toBeTruthy();

    const response = await open(page, href!);
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\//);
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe("RealEstateListing");

    const missing = await open(page, "/en/listing/999999999");
    expect(missing?.status()).toBe(404);
  });

  test("the app links back to the website", async ({ page }) => {
    await page.getByRole("link", { name: "Website" }).locator("visible=true").first().click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test("profile, inbox and notifications open", async ({ page }) => {
    await open(page, "/en/profile");
    await expect(page.getByRole("link", { name: /edit profile/i })).toBeVisible();

    await open(page, "/en/inbox");
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible();

    await open(page, "/en/notifications");
    await expect(page.getByRole("heading", { name: "Notifications" })).toBeVisible();
  });

  test("logging out lands on the login screen", async ({ page }) => {
    await open(page, "/en/profile");
    await page.getByRole("button", { name: "Profile" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Logout" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Logout" }).click();
    await expect(page).toHaveURL(/\/en\/login/);

    // And the app stays closed afterwards.
    await open(page, "/en/feed");
    await expect(page).toHaveURL(/\/en\/login\?next=%2Ffeed$/);
  });
});

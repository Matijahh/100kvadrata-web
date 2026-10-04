import { devices } from "@playwright/test";
import { expect, findLiveListingId, open, test } from "./helpers";

test.describe("guest browsing", () => {
  test("phones are offered the app once", async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== "phone", "The prompt is for phones only.");
    // A fresh page without the helper's dismissal.
    const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: testInfo.project.use.baseURL });
    const page = await context.newPage();
    await page.goto("/en/feed", { waitUntil: "domcontentloaded" });
    const prompt = page.getByRole("dialog");
    await expect(prompt).toContainText("100m² feels best in the app");
    await prompt.getByRole("button", { name: "Continue on web" }).click();
    await expect(prompt).toBeHidden();
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-reel-index='0']")).toBeVisible();
    await expect(page.getByRole("dialog")).toBeHidden();
    await context.close();
  });

  test("landing page links to both stores", async ({ page }) => {
    await open(page, "/en");
    await expect(page).toHaveTitle(/100m²/);
    await expect(page.locator('a[href*="apps.apple.com"]').first()).toBeAttached();
    await expect(page.locator('a[href*="play.google.com"]').first()).toBeAttached();
  });

  test("feed opens on the reel and remembers the grid", async ({ page }) => {
    await open(page, "/en/feed");
    await expect(page.locator("[data-reel-index='0']")).toBeVisible();

    await page.getByRole("radio", { name: "Grid" }).click();
    await expect(page.locator('main a[href*="/listing/"]').first()).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("radio", { name: "Grid" })).toHaveAttribute("aria-checked", "true");
  });

  test("arrow keys page through the reel", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "phone", "Keyboard paging is a desktop affordance.");
    await open(page, "/en/feed");
    await expect(page.locator("[data-reel-index='0']")).toBeInViewport({ ratio: 0.9 });

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("[data-reel-index='1']")).toBeInViewport({ ratio: 0.9 });
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("[data-reel-index='0']")).toBeInViewport({ ratio: 0.9 });
  });

  test("a search narrows the feed and shows as a chip", async ({ page }) => {
    await open(page, "/en/feed");
    await expect(page.locator("[data-reel-index='0']")).toBeVisible();
    const search = page.getByRole("searchbox", { name: "Search" });
    await search.fill("Beograd");
    await search.press("Enter");
    await expect(page.locator("header li", { hasText: "Beograd" })).toBeVisible();
  });

  test("liking as a guest asks to sign in", async ({ page }) => {
    await open(page, "/en/feed");
    await page.getByRole("button", { name: /^Like/ }).first().click();
    await expect(page.getByRole("dialog")).toContainText("Sign in to like listings");
  });

  test("account pages send guests to sign in", async ({ page }) => {
    await open(page, "/en/profile");
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fprofile/);
    await expect(page.getByLabel("Email:")).toBeVisible();
  });

  test("listing page is server-rendered with share and search metadata", async ({ page, request }) => {
    const id = await findLiveListingId(request);
    test.skip(!id, "No live listings to open.");

    const response = await open(page, `/en/listing/${id}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\//);
    const jsonLd = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(jsonLd ?? "{}")["@type"]).toBe("RealEstateListing");
  });

  test("a missing listing is a real 404", async ({ page }) => {
    const response = await open(page, "/en/listing/999999999");
    expect(response?.status()).toBe(404);
  });
});

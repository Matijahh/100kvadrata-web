import { test as base, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Playwright's `test`, with the phone "get the app" sheet already dismissed —
 * otherwise it covers every page on the phone project. (The prompt itself is
 * left to a test of its own.)
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("100m2.appPromptDismissedAt", String(Date.now()));
      } catch {
        // Storage blocked: the prompt would show, and the test says so.
      }
    });
    await use(page);
  },
});

export { expect } from "@playwright/test";

/**
 * Navigate without waiting for every image: the feed's photos go through the
 * image optimizer, which is slow on a cold dev server, and no test needs them
 * loaded to make its point.
 */
export const open = (page: Page, path: string) => page.goto(path, { waitUntil: "domcontentloaded" });

/** A live listing id, read from the sitemap (so tests never hard-code data). */
export async function findLiveListingId(request: APIRequestContext): Promise<string | null> {
  const response = await request.get("/sitemap.xml");
  const xml = await response.text();
  return xml.match(/<loc>[^<]*\/listing\/(\d+)<\/loc>/)?.[1] ?? null;
}

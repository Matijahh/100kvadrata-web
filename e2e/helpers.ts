import { test as base, type Page } from "@playwright/test";

/**
 * Playwright's `test`, with the "get the app" card already closed —
 * otherwise it sits over the bottom of every page. (The prompt itself is
 * left to a test of its own.)
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.setItem("100m2.appPromptDismissed", "1");
      } catch {
        // Storage blocked: the card never shows anyway.
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

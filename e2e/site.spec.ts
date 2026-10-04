import { expect, test } from "@playwright/test";

// Endpoints and headers: no page rendering involved, so they run once.
test.describe("site endpoints", () => {
  test.skip(({ isMobile }) => isMobile, "Runs once, on the desktop project.");

  test("robots.txt keeps crawlers on the website and points at the sitemap", async ({ request }) => {
    const body = await (await request.get("/robots.txt")).text();
    expect(body).toContain("Disallow: /feed");
    expect(body).toContain("Disallow: /listing/");
    expect(body).toContain("Disallow: /en/chat/");
    expect(body).toMatch(/Sitemap: https:\/\/100-kvadrata\.rs\/sitemap\.xml/);
  });

  test("sitemap lists the website, not the account-only app", async ({ request }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.headers()["content-type"]).toContain("xml");
    const body = await response.text();
    expect(body).toContain("<loc>https://100-kvadrata.rs/delete-account</loc>");
    expect(body).not.toMatch(/\/(feed|listing|user)\b/);
  });

  test("pages carry the security headers", async ({ request }) => {
    const headers = (await request.get("/en/feed")).headers();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });

  test("the store-linked legal pages resolve", async ({ request }) => {
    for (const path of ["/privacy-policy", "/terms-of-service", "/delete-account", "/en/delete-account"]) {
      expect((await request.get(path)).status(), path).toBe(200);
    }
  });

  test("app-link files are served as JSON", async ({ request }) => {
    for (const path of ["/.well-known/apple-app-site-association", "/.well-known/assetlinks.json"]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(200);
      expect(response.headers()["content-type"], path).toContain("application/json");
    }
  });
});

import { SITE_ORIGIN } from "@/content/common";
import type { MetadataRoute } from "next";

// The web app needs an account for every page, so crawlers would only ever
// be redirected to login: keep them on the website.
const APP_PATHS = [
  "/feed",
  "/listing/",
  "/user/",
  "/profile",
  "/edit-profile",
  "/new-listing",
  "/inbox",
  "/chat/",
  "/notifications",
  "/preferences/",
  "/onboarding",
  "/choose-username",
  "/update-password",
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  "/auth/",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: APP_PATHS.flatMap((path) => [path, `/en${path}`]),
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}

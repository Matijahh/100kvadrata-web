import { SITE_ORIGIN } from "@/content/common";
import type { MetadataRoute } from "next";

// Account-only and setup screens have nothing for a crawler (they redirect
// guests to sign-in anyway); everything public stays crawlable.
const PRIVATE_PATHS = [
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
  "/verify-email",
  "/auth/",
  "/get-app",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS.flatMap((path) => [path, `/en${path}`]),
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}

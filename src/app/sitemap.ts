import { SITE_ORIGIN } from "@/content/common";
import type { MetadataRoute } from "next";

const url = (path: string) => `${SITE_ORIGIN}${path === "/" ? "" : path}`;

/** Both language versions of a path, each pointing at the other. */
const localized = (
  path: string,
  extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> = {},
): MetadataRoute.Sitemap => {
  const sr = url(path);
  const en = url(path === "/" ? "/en" : `/en${path}`);
  const alternates = { languages: { sr, en, "x-default": sr } };
  return [
    { url: sr, alternates, ...extra },
    { url: en, alternates, ...extra },
  ];
};

/**
 * The website only. The web app needs an account for every page (no guest
 * mode), so listings and profiles are not something a crawler can open.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...localized("/", { changeFrequency: "weekly", priority: 1 }),
    ...localized("/privacy-policy", { changeFrequency: "monthly", priority: 0.3 }),
    ...localized("/terms-of-service", { changeFrequency: "monthly", priority: 0.3 }),
    ...localized("/delete-account", { changeFrequency: "yearly", priority: 0.2 }),
  ];
}

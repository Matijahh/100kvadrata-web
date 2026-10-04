/** Where the app goes when no `next` destination was asked for. */
export const DEFAULT_APP_PATH = "/feed";

/**
 * Validates a `?next=` destination: only same-site, locale-free app paths are
 * accepted, so a crafted link can never bounce a user to another site after
 * signing in (`//evil.com` and `https://…` are rejected).
 */
export const sanitizeNextPath = (
  value: string | null | undefined,
  fallback: string = DEFAULT_APP_PATH,
): string => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  // Drop a locale prefix — navigation adds the current one back.
  const withoutLocale = value.replace(/^\/(en|sr)(?=\/|$)/, "") || "/";

  // The landing page lives in the marketing site; signed-in users belong in
  // the app.
  return withoutLocale === "/" ? fallback : withoutLocale;
};

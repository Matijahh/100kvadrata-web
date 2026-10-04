// The web app has no guest mode: every page needs an account except these.
// Used by the proxy (redirect before rendering) and by SessionGuard (redirect
// when a session ends or a stale cookie got past the proxy).
//
// Paths are without the locale prefix ("/en/login" → "/login").

/** The marketing site: its pages are public by definition. */
const WEBSITE_PATHS = ["/", "/privacy-policy", "/terms-of-service", "/delete-account"];

/** What it takes to get an account or into one. */
const AUTH_PATHS = [
  "/login",
  "/register",
  "/verify-email",
  "/forgot-password",
  // OAuth return: it is what creates the session.
  "/auth/callback",
];

const PUBLIC_PATHS = new Set([...WEBSITE_PATHS, ...AUTH_PATHS]);

export const isPublicPath = (path: string) => PUBLIC_PATHS.has(path.replace(/\/+$/, "") || "/");

import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

// App routes that need an account. Guests who open one directly are sent to
// login and brought back afterwards; inside the app the nav opens the sign-in
// dialog instead of navigating, like the mobile tab bar does.
const PROTECTED_PREFIXES = [
  "/profile",
  "/edit-profile",
  "/new-listing",
  "/inbox",
  "/chat",
  "/notifications",
  "/preferences",
  "/onboarding",
  "/choose-username",
  "/update-password",
];

const stripLocale = (pathname: string) => {
  const match = pathname.match(/^\/(en|sr)(\/.*|$)/);
  return {
    locale: match ? match[1] : routing.defaultLocale,
    path: match ? match[2] || "/" : pathname,
  };
};

// Only checks that a Supabase session cookie exists — a cheap UX redirect with
// no network call. Real authorization is RLS on every query, and the browser
// client refreshes the session itself.
const hasSessionCookie = (request: NextRequest) =>
  request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));

export default function proxy(request: NextRequest) {
  const { locale, path } = stripLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSessionCookie(request)) {
    const login = request.nextUrl.clone();
    login.pathname = locale === routing.defaultLocale ? "/login" : `/${locale}/login`;
    login.search = "";
    login.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  return intl(request);
}

export const config = {
  // Run on every path except API routes, Next internals, and anything with a
  // dot (static files: images, fonts, favicon, robots.txt, /.well-known/*).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

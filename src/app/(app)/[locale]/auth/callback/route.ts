import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/nextPath";
import { createServerSupabase } from "@/lib/supabaseServer";

// Where Google / Apple sign-in comes back to (PKCE flow). Exchanges the code
// for a session — written to cookies, so the browser client picks it up — and
// then routes like the app's SocialAuthButtons: accounts without a username go
// to choose-username, everyone else to where they were headed.
//
// This URL (and its /en twin) must be listed under Supabase → Authentication →
// URL Configuration → Redirect URLs.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const prefix = locale === "en" ? "/en" : "";
  const redirectTo = (path: string) => NextResponse.redirect(new URL(prefix + path, url.origin));

  // Closing the consent screen comes back as access_denied. In the app a
  // cancelled sheet just leaves you where you were, so no error toast here.
  if (url.searchParams.get("error") === "access_denied") {
    return redirectTo("/login");
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return redirectTo("/login?error=oauth");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error("OAuth code exchange failed", error);
    return redirectTo("/login?error=oauth");
  }

  const user = data.user;

  // Apple shares the person's name only on the very first authorization, so
  // keep it now — same rule as signInWithApple in the app. Never overwrites a
  // name the user has already set.
  if (user.app_metadata?.provider === "apple") {
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined);

    if (fullName?.trim()) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .is("full_name", null);
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.username) {
    return redirectTo("/choose-username");
  }

  return redirectTo(sanitizeNextPath(url.searchParams.get("next")));
}

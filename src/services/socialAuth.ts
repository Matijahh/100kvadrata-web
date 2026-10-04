import { supabase } from "@/lib/supabase";

// Platform adapter — the mobile app signs in with the native Google / Apple
// SDKs and hands the ID token to Supabase. On the web the same Supabase
// providers are used through the OAuth redirect flow, so accounts are shared:
// whoever signed up with Apple on an iPhone signs in with Apple here too.

export type OAuthProvider = "google" | "apple";

/**
 * Leaves the page for the provider's consent screen. Control comes back at
 * /auth/callback (in the same language), which exchanges the code for a
 * session and forwards to `next` — or to choose-username when the account
 * has no username yet.
 */
export const startOAuthSignIn = async (
  provider: OAuthProvider,
  next = "/feed",
  locale: "sr" | "en" = "sr",
) => {
  const callbackPath = locale === "en" ? "/en/auth/callback" : "/auth/callback";
  const callback = new URL(callbackPath, window.location.origin);
  callback.searchParams.set("next", next);

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callback.toString() },
  });

  if (error) {
    throw error;
  }
};

export const hasUsername = async (userId: string) => {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  return !!data?.username;
};

export const setUsername = async (username: string) => {
  const { error } = await supabase.rpc("set_username", {
    p_username: username,
  });

  if (error) {
    if (error.message.includes("username_already_taken")) {
      throw new Error("username_already_taken");
    }
    throw error;
  }
};

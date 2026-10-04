"use client";

import { withLocale } from "@/content/common";
import type { Locale } from "@/i18n/routing";
import { useEffect, useState } from "react";

type AccountState =
  | { kind: "pending" }
  | { kind: "guest" }
  | { kind: "user"; name: string; avatarUrl: string | null };

// Same test the proxy uses: a Supabase session cookie exists (it may be
// chunked as …-auth-token.0, .1).
const hasSessionCookie = () =>
  document.cookie
    .split(";")
    .some((part) => {
      const name = part.trim().split("=")[0];
      return name.startsWith("sb-") && name.includes("-auth-token");
    });

/**
 * The website's way into the web app, top right of the header: "Log in" and
 * "Sign up" for visitors, the account's name (straight into the app) for
 * someone already signed in.
 *
 * The marketing pages are static and carry none of the app's code, so this
 * checks the session in the browser — and only loads the Supabase client when
 * a session cookie is there at all, so visitors download nothing extra.
 * Links are plain <a>: the app is a different root layout (full page load).
 */
export function AccountLinks({
  locale,
  labels,
}: {
  locale: Locale;
  labels: { login: string; register: string; openApp: string };
}) {
  const [state, setState] = useState<AccountState>({ kind: "pending" });

  useEffect(() => {
    if (!hasSessionCookie()) {
      setState({ kind: "guest" });
      return;
    }

    let cancelled = false;
    (async () => {
      const { supabase } = await import("@/lib/supabase");
      // Reads the cookie; only touches the network to refresh an old token.
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        if (!cancelled) setState({ kind: "guest" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setState({
        kind: "user",
        name: profile?.username || user.email?.split("@")[0] || labels.openApp,
        avatarUrl: profile?.avatar_url ?? null,
      });
    })().catch(() => {
      if (!cancelled) setState({ kind: "guest" });
    });

    return () => {
      cancelled = true;
    };
  }, [labels.openApp]);

  if (state.kind === "user") {
    return (
      <nav className="account" aria-label={labels.openApp}>
        <a className="account__user" href={withLocale(locale, "/feed")} title={labels.openApp}>
          {state.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="account__avatar" src={state.avatarUrl} alt="" />
          ) : (
            <span className="account__avatar" aria-hidden="true">
              {state.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="account__name">{state.name}</span>
        </a>
      </nav>
    );
  }

  // Rendered (but invisible) while the session check runs, so the header does
  // not shift when the links appear.
  return (
    <nav className="account" aria-label={labels.openApp} data-pending={state.kind === "pending" || undefined}>
      <a className="account__login" href={withLocale(locale, "/login")}>
        {labels.login}
      </a>
      <a className="account__register" href={withLocale(locale, "/register")}>
        {labels.register}
      </a>
    </nav>
  );
}

import { AppLanguage, SessionUser } from "@/types/types";
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { deleteAccount as deleteAccountRequest } from "@/services/profile";
import { OAuthProvider, startOAuthSignIn } from "@/services/socialAuth";
import { useThemeStore } from "@/stores/useThemeStore";

// Platform adapter — mirrors flatswipe/src/stores/useAuthStore.ts. Email flows
// are the same Supabase calls (OTP codes, no links), so behaviour and error
// codes match the app. Differences: the session lives in cookies via the
// Supabase browser client (nothing extra to persist here), and social sign-in
// is a redirect, so it resolves only by coming back through /auth/callback.

export type RegisterResult = { needsVerification: boolean };

export type UnconfirmedEmailError = Error & { email: string };

type AuthStore = {
  sessionUser: SessionUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
  ) => Promise<RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerificationCode: (email: string) => Promise<void>;
  loginWithProvider: (
    provider: OAuthProvider,
    next?: string,
    locale?: AppLanguage,
  ) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  setSessionUser: (user: SessionUser | null) => void;
};

const mapAuthUserToSessionUser = (
  authUser?: { id: string; email?: string | null } | null,
): SessionUser | null => {
  if (!authUser) {
    return null;
  }

  return {
    id: authUser.id,
    email: authUser.email ?? null,
  };
};

export const useAuthStore = create<AuthStore>()((set) => ({
  sessionUser: null,
  isAuthenticated: false,
  isReady: false,
  setSessionUser: (sessionUser) =>
    set({
      sessionUser,
      isAuthenticated: !!sessionUser,
      isReady: true,
    }),
  initializeAuth: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const sessionUser = mapAuthUserToSessionUser(session?.user);

    set({
      sessionUser,
      isAuthenticated: !!sessionUser,
      isReady: true,
    });
  },
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.code === "email_not_confirmed") {
        const unconfirmed = new Error("email_not_confirmed") as UnconfirmedEmailError;
        unconfirmed.email = email;
        throw unconfirmed;
      }

      throw error;
    }

    const sessionUser = mapAuthUserToSessionUser(data.user);

    set({
      sessionUser,
      isAuthenticated: !!sessionUser,
      isReady: true,
    });
  },
  register: async (email: string, password: string, username: string) => {
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (existingProfile) {
      throw new Error("username_already_taken");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) {
      throw error;
    }

    // With email confirmation enabled, signUp for an already-registered
    // email returns an obfuscated user with an empty identities array
    // instead of an error.
    if (data.user && data.user.identities?.length === 0) {
      throw new Error("User already registered");
    }

    if (!data.session) {
      // Email confirmation is required — no session until the OTP code
      // from the confirmation email is verified.
      return { needsVerification: true };
    }

    const sessionUser = mapAuthUserToSessionUser(data.user);

    set({
      sessionUser,
      isAuthenticated: !!sessionUser,
      isReady: true,
    });

    return { needsVerification: false };
  },
  verifyEmail: async (email: string, code: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });

    if (error) {
      throw error;
    }

    const sessionUser = mapAuthUserToSessionUser(data.user);

    set({
      sessionUser,
      isAuthenticated: !!sessionUser,
      isReady: true,
    });
  },
  resendVerificationCode: async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      throw error;
    }
  },
  loginWithProvider: async (provider, next, locale) => {
    await startOAuthSignIn(provider, next, locale);
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    useThemeStore.getState().setTheme("light");

    set({
      sessionUser: null,
      isAuthenticated: false,
      isReady: true,
    });
  },
  deleteAccount: async () => {
    await deleteAccountRequest();

    // The auth user no longer exists, so only clear the local session.
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});

    useThemeStore.getState().setTheme("light");

    set({
      sessionUser: null,
      isAuthenticated: false,
      isReady: true,
    });
  },
}));

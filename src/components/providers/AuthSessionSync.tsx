"use client";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Web counterpart of the app's AuthSessionSync: hydrates the auth store from
// the Supabase session and follows sign-in / sign-out (including from another
// tab, which the browser client broadcasts). On sign-out every cached query is
// dropped so the next user never sees the previous one's data.
export function AuthSessionSync() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const setSessionUser = useAuthStore((state) => state.setSessionUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    initializeAuth().catch((error) => {
      console.log("Failed to initialize auth session", error);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user ?? null;

      setSessionUser(
        authUser ? { id: authUser.id, email: authUser.email ?? null } : null,
      );

      if (event === "SIGNED_OUT") {
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, setSessionUser, queryClient]);

  return null;
}

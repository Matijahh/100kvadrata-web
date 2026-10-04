"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { isPublicPath } from "@/lib/publicPaths";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

/**
 * The client half of "no guest mode". The proxy only sees whether a session
 * cookie exists; this catches the rest — a cookie whose session is gone, a
 * sign-out in another tab, a session that expires while the page is open —
 * and sends the user to login, back to where they were afterwards.
 */
export function SessionGuard() {
  const isReady = useAuthStore((state) => state.isReady);
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || sessionUser || isPublicPath(pathname)) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isReady, sessionUser, pathname, router]);

  return null;
}

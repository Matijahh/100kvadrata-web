import type { Metadata } from "next";
import { GetTheAppPrompt } from "@/components/shell/GetTheAppPrompt";
import { Suspense } from "react";

// Auth screens render without the app navigation. The Suspense boundary lets
// the forms read `?next=` / `?email=` (useSearchParams) while the rest of the
// page is still prerendered. With no guest mode, login is the first web-app
// screen a phone visitor sees, so the "get the app" sheet shows here too.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="min-h-dvh bg-[#161722]" />}>{children}</Suspense>
      <GetTheAppPrompt onAuthScreen />
    </>
  );
}

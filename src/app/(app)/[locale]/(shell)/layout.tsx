import { AppShell } from "@/components/shell/AppShell";

// Pages with the app's navigation (feed, listing, messages, profile, ...).
// Auth screens live in (auth) and render without it.
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

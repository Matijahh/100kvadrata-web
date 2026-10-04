import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware navigation for the web app: `<Link href="/feed">` and
// `router.push("/feed")` add the "/en" prefix for English automatically, and
// `router.replace(pathname, { locale })` switches language on the same page.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

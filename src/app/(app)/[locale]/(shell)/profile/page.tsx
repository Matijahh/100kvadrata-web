import { titleMetadata } from "@/lib/pageMetadata";
import { Suspense } from "react";
import { ProfileView } from "./ProfileView";

export const generateMetadata = titleMetadata("profile.title");

export default function ProfilePage() {
  // Suspense: the view reads ?section= with useSearchParams.
  return (
    <Suspense>
      <ProfileView />
    </Suspense>
  );
}

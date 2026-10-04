import { titleMetadata } from "@/lib/pageMetadata";
import { ProfileView } from "./ProfileView";

export const generateMetadata = titleMetadata("profile.title");

export default function ProfilePage() {
  return <ProfileView />;
}

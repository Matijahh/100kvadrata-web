import { titleMetadata } from "@/lib/pageMetadata";
import { EditProfileForm } from "./EditProfileForm";

export const generateMetadata = titleMetadata("profile.editProfile");

export default function EditProfilePage() {
  return <EditProfileForm />;
}

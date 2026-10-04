import { titleMetadata } from "@/lib/pageMetadata";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export const generateMetadata = titleMetadata("web.titles.updatePassword");

export default function Page() {
  return <UpdatePasswordForm />;
}

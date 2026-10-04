import { titleMetadata } from "@/lib/pageMetadata";
import { VerifyEmailForm } from "./VerifyEmailForm";

export const generateMetadata = titleMetadata("web.titles.verifyEmail");

export default function Page() {
  return <VerifyEmailForm />;
}

import { titleMetadata } from "@/lib/pageMetadata";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const generateMetadata = titleMetadata("web.titles.forgotPassword");

export default function Page() {
  return <ForgotPasswordForm />;
}

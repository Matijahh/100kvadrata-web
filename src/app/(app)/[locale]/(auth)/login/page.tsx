import { titleMetadata } from "@/lib/pageMetadata";
import { LoginForm } from "./LoginForm";

export const generateMetadata = titleMetadata("web.titles.login");

export default function LoginPage() {
  return <LoginForm />;
}

import { titleMetadata } from "@/lib/pageMetadata";
import { RegisterForm } from "./RegisterForm";

export const generateMetadata = titleMetadata("web.titles.register");

export default function Page() {
  return <RegisterForm />;
}

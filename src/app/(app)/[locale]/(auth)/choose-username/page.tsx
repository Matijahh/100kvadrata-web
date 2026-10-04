import { titleMetadata } from "@/lib/pageMetadata";
import { ChooseUsernameForm } from "./ChooseUsernameForm";

export const generateMetadata = titleMetadata("web.titles.chooseUsername");

export default function Page() {
  return <ChooseUsernameForm />;
}

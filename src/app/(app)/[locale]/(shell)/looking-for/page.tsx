import { titleMetadata } from "@/lib/pageMetadata";
import { LookingForView } from "./LookingForView";

export const generateMetadata = titleMetadata("preferences.title");

export default function LookingForPage() {
  return <LookingForView />;
}

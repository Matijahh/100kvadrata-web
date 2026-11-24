import { titleMetadata } from "@/lib/pageMetadata";
import { AdminGameView } from "./AdminGameView";

export const generateMetadata = titleMetadata("growth.title");

export default function AdminGamePage() {
  return <AdminGameView />;
}

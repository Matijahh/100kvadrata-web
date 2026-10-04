import { titleMetadata } from "@/lib/pageMetadata";
import { NotificationsView } from "./NotificationsView";

export const generateMetadata = titleMetadata("notifications.title");

export default function NotificationsPage() {
  return <NotificationsView />;
}

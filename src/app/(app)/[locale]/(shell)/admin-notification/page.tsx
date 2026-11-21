import { titleMetadata } from "@/lib/pageMetadata";
import { AdminNotificationForm } from "./AdminNotificationForm";

export const generateMetadata = titleMetadata("admin.sendNotification");

export default function AdminNotificationPage() {
  return <AdminNotificationForm />;
}

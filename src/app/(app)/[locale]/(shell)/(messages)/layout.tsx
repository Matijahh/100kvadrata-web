import { MessagesLayout } from "@/components/chat/MessagesLayout";

// Inbox and chat: one two-pane screen on desktop, two screens on phones.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <MessagesLayout>{children}</MessagesLayout>;
}

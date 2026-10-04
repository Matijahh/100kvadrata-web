import { InboxPlaceholder } from "@/components/chat/InboxPlaceholder";
import { titleMetadata } from "@/lib/pageMetadata";

export const generateMetadata = titleMetadata("inbox.title");

// The list itself lives in the layout; on desktop this fills the chat pane
// until a conversation is picked (on phones the pane is hidden).
export default function InboxPage() {
  return <InboxPlaceholder />;
}

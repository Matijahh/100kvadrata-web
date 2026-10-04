import { ChatView } from "@/components/chat/ChatView";
import { titleMetadata } from "@/lib/pageMetadata";
import { Suspense } from "react";

export const generateMetadata = titleMetadata("inbox.title");

export default async function ChatPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const { conversationId } = await params;

  // Keyed so switching conversations starts with a fresh composer.
  return (
    <Suspense>
      <ChatView key={conversationId} conversationId={conversationId} />
    </Suspense>
  );
}

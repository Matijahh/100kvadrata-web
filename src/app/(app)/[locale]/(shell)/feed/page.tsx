import { FeedView } from "@/components/feed/FeedView";
import { titleMetadata } from "@/lib/pageMetadata";

export const generateMetadata = titleMetadata("tabs.home");

export default function FeedPage() {
  return <FeedView />;
}

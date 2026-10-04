import { titleMetadata } from "@/lib/pageMetadata";
import { Suspense } from "react";
import { NewListingFlow } from "./NewListingFlow";

export const generateMetadata = titleMetadata("newListing.title");

export default function NewListingPage() {
  // Suspense: the flow reads ?editListingId= with useSearchParams.
  return (
    <Suspense>
      <NewListingFlow />
    </Suspense>
  );
}

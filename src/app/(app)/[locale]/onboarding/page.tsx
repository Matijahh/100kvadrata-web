import { titleMetadata } from "@/lib/pageMetadata";
import { OnboardingFlow } from "./OnboardingFlow";

// Outside the nav shell on purpose: onboarding is a short, linear flow and the
// tabs would only invite leaving it half-done (the app hides them too).
export const generateMetadata = titleMetadata("web.titles.onboarding");

export default function OnboardingPage() {
  return <OnboardingFlow />;
}

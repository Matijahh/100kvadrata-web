import {
  OnboardingIllustration,
  OnboardingIllustrationSpot,
} from "@/components/onboarding/OnboardingIllustration";

/**
 * The top of the "you're all set" screen, after the app's AllSetHero: the
 * illustration scales in, then the title and body follow a beat later. Small on
 * purpose — it marks the end of a form. With reduced motion everything is
 * simply there (motion-safe variants). No haptics on the web.
 */
export function AllSetHero({
  spot,
  title,
  body,
}: {
  spot: Extract<OnboardingIllustrationSpot, "readySeller" | "readyBuyer">;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-2.5 motion-safe:animate-[all-set-in_450ms_cubic-bezier(0.33,1,0.68,1)_both]">
        <OnboardingIllustration spot={spot} height={240} className="[&_svg]:max-h-[min(260px,60vw)] md:[&_svg]:h-[min(320px,38dvh)] md:[&_svg]:max-h-none md:[&_svg]:w-auto" />
      </div>
      <h1 className="font-display text-[26px] leading-8 text-text motion-safe:animate-[fade-in-down_350ms_ease-out_150ms_both]">
        {title}
      </h1>
      <p className="mt-2.5 max-w-md text-[15px] leading-[22px] text-text-muted motion-safe:animate-[fade-in-down_350ms_ease-out_250ms_both]">
        {body}
      </p>
    </div>
  );
}

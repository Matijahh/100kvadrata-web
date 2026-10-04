import GoalDark from "@assets/illustrations/goal-dark.svg";
import GoalLight from "@assets/illustrations/goal.svg";
import WelcomeDark from "@assets/illustrations/welcome-dark.svg";
import WelcomeLight from "@assets/illustrations/welcome.svg";
import WhatYouLookingDark from "@assets/illustrations/what-you-looking-dark.svg";
import WhatYouLookingLight from "@assets/illustrations/what-you-looking.svg";
import { cn } from "@/lib/cn";
import type { FC, SVGProps } from "react";

// Web counterpart of the app's OnboardingIllustration. The art is coloured in
// the brand palette, so each comes in a light and a dark version; both are
// rendered and CSS shows the one for the active theme (no hydration mismatch).

export type OnboardingIllustrationSpot = "welcome" | "details" | "readySeller" | "readyBuyer";

type Svg = FC<SVGProps<SVGSVGElement>>;

type ThemedArt = {
  light: Svg;
  dark: Svg;
  /** width ÷ height of the artwork's viewBox. */
  aspectRatio: number;
};

const WELCOME: ThemedArt = { light: WelcomeLight, dark: WelcomeDark, aspectRatio: 1 };
const WHAT_YOU_LOOKING: ThemedArt = {
  light: WhatYouLookingLight,
  dark: WhatYouLookingDark,
  aspectRatio: 750 / 500,
};
const GOAL: ThemedArt = { light: GoalLight, dark: GoalDark, aspectRatio: 1 };

const ILLUSTRATIONS: Record<OnboardingIllustrationSpot, ThemedArt | null> = {
  welcome: WELCOME,
  details: WHAT_YOU_LOOKING,
  readySeller: GOAL,
  readyBuyer: GOAL,
};

export const hasOnboardingIllustration = (spot: OnboardingIllustrationSpot) =>
  ILLUSTRATIONS[spot] != null;

export function OnboardingIllustration({
  spot,
  height,
  className,
}: {
  spot: OnboardingIllustrationSpot;
  /** The width follows from the artwork's own proportions. */
  height: number;
  className?: string;
}) {
  const art = ILLUSTRATIONS[spot];

  if (!art) {
    return null;
  }

  const width = height * art.aspectRatio;
  const Light = art.light;
  const Dark = art.dark;

  return (
    <div className={cn("flex justify-center", className)} aria-hidden>
      <Light width={width} height={height} className="max-w-full dark:hidden" />
      <Dark width={width} height={height} className="hidden max-w-full dark:block" />
    </div>
  );
}

"use client";

import ChevronLeftIcon from "@assets/icons/chevron-left-icon.svg";
import HouseSearchIcon from "@assets/icons/house-search-icon.svg";
import PlusCircleIcon from "@assets/icons/plus-circle-icon.svg";
import { OnboardingIllustration } from "@/components/onboarding/OnboardingIllustration";
import { useRouter } from "@/i18n/navigation";
import { useRef, type FC, type SVGProps } from "react";
import { useTranslation } from "react-i18next";

type StartChoice = {
  key: "offer" | "lookFor";
  icon: FC<SVGProps<SVGSVGElement>>;
  href: "/new-listing" | "/looking-for";
};

// Each option wears the icon of the nav item it opens, so the first thing a
// new account learns is where both forms live from now on.
const CHOICES: StartChoice[] = [
  { key: "offer", icon: PlusCircleIcon, href: "/new-listing" },
  { key: "lookFor", icon: HouseSearchIcon, href: "/looking-for" },
];

/**
 * Web port of flatswipe/src/app/(protected)/onboarding.tsx: shown once, right
 * after an account is created — "do you want to offer a property or look for
 * one?"
 *
 * The answer is not saved anywhere. Every account can post listings and say
 * what it is looking for, so this only decides which of the two forms opens
 * first; both stay in the navigation afterwards. With nothing to save, a click
 * goes straight there.
 */
export function OnboardingFlow() {
  const { t } = useTranslation();
  const router = useRouter();
  // A second click while the first is still navigating would replace it.
  const hasChosen = useRef(false);

  const choose = (choice: StartChoice) => {
    if (hasChosen.current) return;
    hasChosen.current = true;
    router.replace(choice.href);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-10">
        <OnboardingIllustration
          spot="welcome"
          height={200}
          className="mb-3.5 [&_svg]:h-[clamp(96px,calc(100dvh-520px),200px)] [&_svg]:w-auto md:[&_svg]:h-[clamp(96px,calc(100dvh-460px),280px)]"
        />
        <p className="text-center text-[13px] font-semibold tracking-[0.4px] text-primary">
          {t("onboarding.welcomeTitle")}
        </p>
        <h1 className="mt-1.5 text-center font-display text-[26px] leading-8 text-text">
          {t("onboarding.choiceTitle")}
        </h1>
        <p className="mt-2 text-center text-[15px] leading-[22px] text-text-muted">
          {t("onboarding.choiceSubtitle")}
        </p>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          {CHOICES.map((choice) => {
            const Icon = choice.icon;

            return (
              <button
                key={choice.key}
                type="button"
                onClick={() => choose(choice)}
                // The border is always there and only changes colour, so
                // hover and press never move the text inside the card.
                className="flex flex-1 items-center gap-3.5 rounded-[22px] border-2 border-transparent bg-surface-muted p-4 text-left transition hover:border-primary-soft/60 focus-visible:border-primary active:border-primary active:bg-surface md:flex-col md:items-start md:p-6"
              >
                <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl border border-border bg-surface text-primary">
                  <Icon width={26} height={26} aria-hidden />
                </span>
                <span className="flex flex-1 flex-col gap-[3px]">
                  <span className="font-display text-[17px] leading-[22px] text-text">
                    {t(`onboarding.choices.${choice.key}.title`)}
                  </span>
                  <span className="text-[13px] leading-[18px] text-text-muted">
                    {t(`onboarding.choices.${choice.key}.description`)}
                  </span>
                </span>
                <ChevronLeftIcon
                  width={20}
                  height={20}
                  className="shrink-0 rotate-180 text-text-muted md:hidden"
                  aria-hidden
                />
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-center text-[13px] font-light leading-[18px] text-text-muted">
          {t("onboarding.choiceNote")}
        </p>
      </main>
    </div>
  );
}

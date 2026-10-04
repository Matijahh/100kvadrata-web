"use client";

import background from "@assets/background.png";
import Logo from "@assets/logo.svg";
import { cn } from "@/lib/cn";
import Image from "next/image";
import { useTranslation } from "react-i18next";

// The frame every auth screen shares, after the app's: the dark-red building
// photo with the logo and tagline, and the form on a white sheet.
//
//   Phone: the photo fills the screen and the sheet slides up from the bottom
//   with the app's 45px rounded top, exactly like the RN screens.
//   Desktop: the photo becomes the left panel and the sheet a full-height panel
//   on the right, keeping the rounded edge on the side that faces the photo.
export function AuthScreen({
  title,
  children,
  className,
}: {
  /** The large heading at the top of the sheet ("Welcome back." etc.). */
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#161722] md:grid md:grid-cols-[minmax(0,1fr)_minmax(440px,560px)]">
      {/* Static on phones, so the photo (absolutely positioned) covers the
          whole screen; positioned from md up, so it covers only this panel. */}
      <section className="md:relative md:flex md:flex-col md:justify-center md:overflow-hidden">
        <Image
          src={background}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="(min-width: 768px) 60vw, 100vw"
          className="object-cover object-[center_30%]"
        />
        <header className="relative px-[25px] pt-[72px] md:px-16 md:pt-0">
          <Logo width={77} height={44} className="md:h-[68px] md:w-[120px]" aria-hidden />
          <p className="mb-1.5 mt-3 font-display text-[32px] leading-tight text-white md:mt-6 md:max-w-md md:text-5xl">
            {t("auth.heroTitle")}
          </p>
          <p className="text-xl font-light text-white md:text-2xl">{t("auth.heroSubtitle")}</p>
        </header>
      </section>

      <main
        className={cn(
          "relative mt-[35px] flex flex-1 flex-col rounded-t-[45px] bg-surface px-[25px] pb-10 pt-[30px]",
          "animate-[sheet-up_500ms_cubic-bezier(0.33,1,0.68,1)]",
          "md:col-start-2 md:mt-0 md:justify-center md:rounded-l-[45px] md:rounded-tr-none md:px-14 md:py-12",
          "md:animate-[fade-in_300ms_ease-out]",
          className,
        )}
      >
        <div className="mx-auto w-full max-w-[420px]">
          <h1 className="mb-[15px] font-display text-[27px] text-primary">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}

/** The primary submit button of an auth form, styled like the app's. */
export function AuthSubmitButton({
  label,
  loadingLabel,
  isLoading,
  onClick,
  type = "submit",
}: {
  label: string;
  loadingLabel: string;
  isLoading: boolean;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className="mt-[30px] w-full rounded-[25px] bg-primary p-[15px] font-display text-lg uppercase text-text-on-primary transition-opacity hover:opacity-90 disabled:opacity-70"
    >
      {isLoading ? loadingLabel : label}
    </button>
  );
}

/** Underlined semibold link text, the app's `linkText` style. */
export const authLinkClass =
  "text-sm font-semibold text-primary underline underline-offset-2 hover:opacity-80 disabled:opacity-50 disabled:no-underline";

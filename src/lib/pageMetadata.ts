import "server-only";
import { getServerT } from "@/i18n/server";
import type { AppLanguage } from "@/types/types";
import type { Metadata } from "next";

type LocaleParams = { params: Promise<{ locale: string }> };

/** `generateMetadata` for pages whose only metadata is a translated title. */
export const titleMetadata =
  (key: string) =>
  async ({ params }: LocaleParams): Promise<Metadata> => {
    const { locale } = await params;
    return { title: getServerT(locale as AppLanguage)(key) };
  };

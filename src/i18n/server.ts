import "server-only";
import { createInstance, type TFunction } from "i18next";
import type { AppLanguage } from "@/types/types";
import { baseOptions } from "./resources";

// Translations for server components (metadata, server-rendered pages). Same
// resources as the client, without react-i18next.

const translators: Partial<Record<AppLanguage, TFunction>> = {};

export const getServerT = (language: AppLanguage): TFunction => {
  if (!translators[language]) {
    const instance = createInstance();
    instance.init({ ...baseOptions, lng: language });
    translators[language] = instance.t.bind(instance);
  }
  return translators[language]!;
};

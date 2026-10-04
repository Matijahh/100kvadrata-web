"use client";

import MessagesIcon from "@assets/icons/messages-icon.svg";
import { useTranslation } from "react-i18next";

export function InboxPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <MessagesIcon width={56} height={56} className="text-tab-inactive" aria-hidden />
      <p className="max-w-xs text-[15px] text-text-muted">{t("web.chat.selectConversation")}</p>
    </div>
  );
}

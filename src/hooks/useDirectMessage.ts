"use client";

import { useToast } from "@/components/providers/ToastProvider";
import { useRouter } from "@/i18n/navigation";
import { findOrCreateConversation } from "@/services/chat";
import { useAuthStore } from "@/stores/useAuthStore";
import { useState } from "react";
import { useTranslation } from "react-i18next";

// Platform adapter — same exports as flatswipe/src/hooks/useDirectMessage.ts,
// navigating with next-intl's router instead of expo-router.
//
// Opens (or reuses) a plain conversation with someone, no listing attached.
// Admins use it to message anyone (FEAT-42); anyone can use it to answer a
// marketing post.
export const useDirectMessage = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const router = useRouter();
  const sessionUser = useAuthStore((state) => state.sessionUser);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const openDirectMessage = async (otherUserId: string) => {
    if (!sessionUser || pendingUserId || otherUserId === sessionUser.id) return;

    setPendingUserId(otherUserId);
    try {
      const conversation = await findOrCreateConversation(sessionUser.id, otherUserId);
      router.push(`/chat/${conversation.id}`);
    } catch {
      showToast({ type: "error", message: t("admin.messageError") });
    } finally {
      setPendingUserId(null);
    }
  };

  return { openDirectMessage, pendingUserId };
};

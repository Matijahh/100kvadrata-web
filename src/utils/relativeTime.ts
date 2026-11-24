// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// The compact age shown in the inbox and notifications: "now", "5m", "3h",
// "2d" in English, "sada", "5 min", "3 h", "2 d" in Serbian. Pure, so the web
// app shares it through its sync script.

type TranslateFn = (key: string, options?: { count: number }) => string;

export const formatRelativeTime = (dateStr: string, t: TranslateFn): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("time.now");
  if (mins < 60) return t("time.minutesShort", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("time.hoursShort", { count: hours });
  const days = Math.floor(hours / 24);
  return t("time.daysShort", { count: days });
};

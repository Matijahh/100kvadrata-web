// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// The compact age shown in the inbox and notifications: "now", "5m", "3h",
// "2d" in English, "sada", "5 min", "3 h", "2 d" in Serbian. Pure, so the web
// app shares it through its sync script.

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

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

const pad = (value: number) => String(value).padStart(2, "0");

/** "14:05": when a chat message was sent, 24-hour in both languages. */
export const formatClockTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** The calendar day a moment falls on, on this device: "2026-11-26". */
export const localDayKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * The heading over a day's messages in a chat: "Danas", "Juče", or the date
 * ("12. novembra" / "12 November"), with the year only when it isn't this
 * year's.
 */
export const formatDayLabel = (
  dateStr: string,
  t: TranslateFn,
  language: string,
  now: Date = new Date(),
): string => {
  const date = new Date(dateStr);
  const today = localDayKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  const key = localDayKey(dateStr);
  if (key === today) {
    return t("time.today");
  }
  if (key === localDayKey(yesterday.toISOString())) {
    return t("time.yesterday");
  }

  const month = t(`time.months.${date.getMonth() + 1}`);
  const year = date.getFullYear() === now.getFullYear() ? "" : ` ${date.getFullYear()}`;

  // Serbian writes "12. novembra 2025."; English "12 November 2025".
  return language.startsWith("sr")
    ? `${date.getDate()}. ${month}${year}${year ? "." : ""}`
    : `${date.getDate()} ${month}${year}`;
};

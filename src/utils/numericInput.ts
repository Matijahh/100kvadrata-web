// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Keystroke-level sanitizers for numeric text fields.
//
// The numeric keypads on iOS and Android differ in which separators they offer
// (and a hardware keyboard offers everything), so the field itself has to keep
// its own value clean rather than trusting `keyboardType`.

/**
 * Keeps digits and a single decimal point, accepting a comma as the separator
 * so a Serbian keypad works the same as an English one.
 */
export const sanitizeDecimalInput = (raw: string) => {
  const normalized = raw.replace(",", ".").replace(/[^0-9.]/g, "");
  const firstDot = normalized.indexOf(".");
  if (firstDot === -1) return normalized;
  return (
    normalized.slice(0, firstDot + 1) +
    normalized.slice(firstDot + 1).replace(/\./g, "")
  );
};

/** Digits only — for counts that cannot be fractional, such as a loan term. */
export const sanitizeIntegerInput = (raw: string) => raw.replace(/[^0-9]/g, "");

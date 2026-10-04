// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Phone number handling for the profile contact field.
//
// Deliberately permissive. Numbers are entered by hand, from any country, in
// whatever grouping the user is used to writing (+381 64 123 4567,
// 064/123-4567, (064) 123 4567). Rejecting a legitimate format is a worse
// failure here than accepting an odd one, so the only real rule is the digit
// count: E.164 allows at most 15, and nothing shorter than 6 is a usable
// number anywhere.

const MIN_DIGITS = 6;
const MAX_DIGITS = 15;
const MAX_LENGTH = 32;

/**
 * Keeps digits and the separators people actually type, plus a single leading
 * `+` for the country code. A `+` anywhere else is dropped, since it only ever
 * means the start of an international prefix.
 */
export const sanitizePhoneInput = (raw: string) => {
  const leadingPlus = raw.trimStart().startsWith("+") ? "+" : "";
  const rest = raw.replace(/[^\d\s()\-.]/g, "");
  return `${leadingPlus}${rest}`.slice(0, MAX_LENGTH);
};

export const countPhoneDigits = (value: string) =>
  (value.match(/\d/g) ?? []).length;

/**
 * An empty field is valid — the phone number is optional. Anything else has to
 * carry a plausible number of digits.
 */
export const isValidPhone = (value: string) => {
  if (!value.trim()) return true;

  const digits = countPhoneDigits(value);
  return digits >= MIN_DIGITS && digits <= MAX_DIGITS;
};

// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Objectionable-content filter for user-generated text (listings, chat,
// comments). Required by App Store Review Guideline 1.2, which asks apps with
// user-generated content to provide "a method for filtering objectionable
// content" alongside reporting and blocking.
//
// Text is normalised before matching so the usual evasions still get caught:
// Cyrillic script, Serbian diacritics, leetspeak, padded punctuation
// ("f.u.c.k") and stretched letters ("jeeebem"). Matching is word-boundary
// based to avoid false positives on innocent words that merely contain a
// blocked substring.

// Serbian Cyrillic → Latin. Digraphs first so they win over single letters.
const CYRILLIC_TO_LATIN: [RegExp, string][] = [
  [/љ/g, "lj"],
  [/њ/g, "nj"],
  [/џ/g, "dz"],
  [/а/g, "a"],
  [/б/g, "b"],
  [/в/g, "v"],
  [/г/g, "g"],
  [/д/g, "d"],
  [/ђ/g, "dj"],
  [/е/g, "e"],
  [/ж/g, "z"],
  [/з/g, "z"],
  [/и/g, "i"],
  [/ј/g, "j"],
  [/к/g, "k"],
  [/л/g, "l"],
  [/м/g, "m"],
  [/н/g, "n"],
  [/о/g, "o"],
  [/п/g, "p"],
  [/р/g, "r"],
  [/с/g, "s"],
  [/т/g, "t"],
  [/ћ/g, "c"],
  [/у/g, "u"],
  [/ф/g, "f"],
  [/х/g, "h"],
  [/ц/g, "c"],
  [/ч/g, "c"],
  [/ш/g, "s"],
];

const LEET_TO_LETTER: [RegExp, string][] = [
  [/[@4]/g, "a"],
  [/[$5]/g, "s"],
  [/[0]/g, "o"],
  [/[1!|]/g, "i"],
  [/[3]/g, "e"],
  [/[7]/g, "t"],
];

// Blocked terms are stored normalised (lowercase, Latin, no diacritics) — the
// same form `normalise()` produces. Keep entries as word stems where the stem
// itself is never part of an innocent word.
const BLOCKED_TERMS: string[] = [
  // Serbian / regional profanity and abuse
  "kurac",
  "kurcu",
  "kurcem",
  "picka",
  "picke",
  "picku",
  "pizda",
  "pizde",
  "jebem",
  "jeben",
  "jebeni",
  "jebati",
  "jebi",
  "jebo",
  "jebac",
  "kurva",
  "kurve",
  "kurvi",
  "drolja",
  "droljo",
  "peder",
  "pederu",
  "pederi",
  "govno",
  "govna",
  "sranje",
  "serem",
  "majkomu",
  "mrs",
  "shupak",
  "supak",
  "budala",
  "kreten",
  "kretenu",
  "idiot",
  "idiote",
  "ustasa",
  "cetnik",
  "balija",
  "siptar",
  "ciganin",
  "cigane",
  // English profanity and abuse
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "shit",
  "bullshit",
  "bitch",
  "bitches",
  "cunt",
  "asshole",
  "dickhead",
  "whore",
  "slut",
  "faggot",
  "nigger",
  "retard",
  "rape",
  "rapist",
  "kill yourself",
  "kys",
];

// "mrs" above is an abbreviation risk in English; drop it from the active set.
const ACTIVE_TERMS = BLOCKED_TERMS.filter((term) => term !== "mrs");

/**
 * Fold text into a comparable form: lowercase Latin, no diacritics, leetspeak
 * resolved, stretched letters collapsed. Word separators are preserved as
 * single spaces so matching can stay word-boundary based.
 */
const normalise = (input: string): string => {
  let text = input.toLowerCase();

  for (const [pattern, replacement] of CYRILLIC_TO_LATIN) {
    text = text.replace(pattern, replacement);
  }

  // Strip diacritics (č ć š ž → c c s z). "đ" has no decomposition.
  text = text.normalize("NFD").replace(/[̀-ͯ]/g, "");
  text = text.replace(/đ/g, "dj");

  for (const [pattern, replacement] of LEET_TO_LETTER) {
    text = text.replace(pattern, replacement);
  }

  // Collapse runs of 3+ identical letters ("jeeeebem" → "jebem"). Two is left
  // alone so legitimate doubles survive.
  text = text.replace(/([a-z])\1{2,}/g, "$1");

  // Anything that is not a letter or digit becomes a single space.
  text = text.replace(/[^a-z0-9]+/g, " ");

  return text.trim();
};

/**
 * Variant with in-word padding removed, so "f u c k" and "f.u.c.k" collapse to
 * "fuck". Only single letters separated by spaces are joined, which keeps
 * ordinary multi-word text intact.
 */
const collapsePaddedLetters = (normalised: string): string =>
  normalised.replace(/\b(?:[a-z] ){1,}[a-z]\b/g, (match) =>
    match.replace(/ /g, ""),
  );

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const matchesTerm = (haystack: string, term: string): boolean =>
  new RegExp(`\\b${escapeRegExp(term)}\\b`).test(haystack);

/**
 * Returns the first blocked term found in `input`, or null when the text is
 * acceptable. Empty/whitespace input is always acceptable.
 */
export const findObjectionableTerm = (
  input: string | null | undefined,
): string | null => {
  if (!input || !input.trim()) {
    return null;
  }

  const normalised = normalise(input);
  const collapsed = collapsePaddedLetters(normalised);

  for (const term of ACTIVE_TERMS) {
    if (matchesTerm(normalised, term) || matchesTerm(collapsed, term)) {
      return term;
    }
  }

  return null;
};

/** Convenience predicate around {@link findObjectionableTerm}. */
export const containsObjectionableContent = (
  input: string | null | undefined,
): boolean => findObjectionableTerm(input) !== null;

/**
 * Checks several fields at once (e.g. a listing's title and description).
 * Returns true when any of them contains objectionable content.
 */
export const anyContainsObjectionableContent = (
  ...inputs: (string | null | undefined)[]
): boolean => inputs.some((input) => containsObjectionableContent(input));

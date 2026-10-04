// AUTO-SYNCED from flatswipe — edit there, then run `npm run sync-shared`.
// Normalization for location autocomplete queries. Must stay in sync with the
// copy in scripts/seed-locations.mjs, which applies the same normalization
// when building the name_search columns.

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", ђ: "dj", е: "e", ж: "z",
  з: "z", и: "i", ј: "j", к: "k", л: "l", љ: "lj", м: "m", н: "n",
  њ: "nj", о: "o", п: "p", р: "r", с: "s", т: "t", ћ: "c", у: "u",
  ф: "f", х: "h", ц: "c", ч: "c", џ: "dz", ш: "s",
};

/**
 * Lowercases, transliterates Serbian Cyrillic to Latin, and strips diacritics
 * so that "Београд", "Beograd" and "beograd" all normalize to "beograd"
 * (and "Đorđa"/"Djordja"/"ђорђа" to "djordja").
 */
export function normalizeLocationText(input: string): string {
  let result = "";
  for (const ch of input.toLowerCase()) {
    result += CYRILLIC_TO_LATIN[ch] ?? ch;
  }
  return result
    .replace(/đ/g, "dj")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

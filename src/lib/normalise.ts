/** Bidi controls (LRM/RLM, embeddings, overrides, isolates) and zero-width characters: used to spoof names/IDs. */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

export function stripInvisible(s: string): string {
  return s.replace(INVISIBLE, '');
}

/** Arabic-Indic (U+0660–0669) and Extended Arabic-Indic/Persian (U+06F0–06F9) digits → ASCII. */
function asciiDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (d) => String(d.charCodeAt(0) & 0xf));
}

/** Invisible characters removed, digits made ASCII, whitespace collapsed and trimmed. */
export function normaliseDigits(s: string): string {
  return asciiDigits(stripInvisible(s)).replace(/\s+/g, ' ').trim();
}

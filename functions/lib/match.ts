/**
 * How typed sign-in details are compared with the roster. Pure functions, no dependencies, shared by the
 * API (functions/) and the roster importer (scripts/), so both sides normalise identically.
 */

const ARABIC_DIGITS = /[٠-٩۰-۹]/g;
const asciiDigits = (s: string) => s.replace(ARABIC_DIGITS, (d) => String(d.charCodeAt(0) & 0xf));

/** Upper-case letters and digits only (the roster key). */
export function normalisePassport(s: string): string {
  return asciiDigits(s.normalize('NFKC')).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** E.164 (`+` and 8–15 digits) or null. Accepts `00` for `+`, spaces, hyphens, dots and a bracketed trunk `(0)`. */
export function normalisePhone(s: string): string | null {
  let t = asciiDigits(s.normalize('NFKC')).trim().replace(/\(0\)/g, '');
  if (t.startsWith('00')) t = `+${t.slice(2)}`;
  if (!t.startsWith('+')) return null;
  const digits = t.slice(1).replace(/[\s().-]/g, '');
  if (!/^\d{8,15}$/.test(digits)) return null;
  return `+${digits}`;
}

export function normaliseEmail(s: string): string {
  return s.normalize('NFKC').trim().toLowerCase();
}

/** Lower-case tokens without diacritics: "Mai Nguyễn" → ["mai", "nguyen"]. Hyphens split, apostrophes stay. */
export function nameKey(s: string): string[] {
  return s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’ʼ]/g, "'")
    .split(/[\s\-·・]+/)
    .filter(Boolean);
}

/**
 * Order-free containment: every token of the shorter name appears in the longer one. One token is enough only
 * when the roster name itself has one; otherwise at least two must match, so "Sara" cannot claim "Sara Ahmed Alqahtani".
 */
export function namesMatch(typed: string, roster: string): boolean {
  const a = nameKey(typed);
  const b = nameKey(roster);
  if (a.length === 0 || b.length === 0) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  const required = Math.min(2, long.length);
  if (short.length < required) return false;
  const pool = new Set(long);
  return short.every((t) => pool.has(t));
}

export interface StudentRow {
  passport_number: string;
  full_name: string;
  phone_e164: string;
  email: string;
  nationality: string | null;
  program: string | null;
  intake_term: string | null;
  status: 'active' | 'withdrawn';
}

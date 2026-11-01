/**
 * DEV ONLY (break-ui stress data). Every use must be guarded as `import.meta.env.DEV && isWorstCase()`
 * at the call site so the production build folds the branch away and drops this module's data
 * (tests/unit/dist.test.ts builds the bundle and searches it to prove nothing leaks).
 */
export function isWorstCase(): boolean {
  return typeof location !== 'undefined' && new URLSearchParams(location.search).get('data') === 'worst';
}

/** What an SSO could plausibly return: a full multi-generation Gulf name with tribal and family names (~200 chars). */
export const WORST_FULL_NAME =
  'عبد الرحمن بن محمد بن عبد الله بن سليمان بن إبراهيم بن صالح بن فهد بن ناصر بن حمد آل الشيخ الغامدي الزهراني القحطاني الدوسري السبيعي العتيبي المطيري الحربي الشمري';

/** A backend might return a content hash as the receipt id: 64 unbroken characters. */
export const WORST_REFERENCE = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

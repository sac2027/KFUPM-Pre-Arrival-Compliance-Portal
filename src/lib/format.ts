import type { Locale } from './termsSchema';

/** Gregorian calendar and Latin digits in both languages, so every printed date reads the same. */
const tag = (locale: Locale) => (locale === 'ar' ? 'ar-u-nu-latn-ca-gregory' : 'en-GB-u-ca-gregory');

export function formatDate(iso: string, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(tag(locale), { day: 'numeric', month: 'long', year: 'numeric', timeZone }).format(new Date(iso));
}

export function formatDateTime(iso: string, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(tag(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(iso));
}

/** Shows only the last four characters: the printed copy leaves the student's hands. */
export function maskPassport(passport: string): string {
  return passport.length <= 4 ? passport : `••••${passport.slice(-4)}`;
}

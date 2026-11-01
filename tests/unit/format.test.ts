import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, maskPassport } from '../../src/lib/format';

const ISO = '2026-11-01T10:06:30.000Z';

describe('formatDate / formatDateTime (Gregorian, Latin digits, both languages)', () => {
  it('formats the date', () => {
    expect(formatDate(ISO, 'en', 'UTC')).toBe('1 November 2026');
    expect(formatDate(ISO, 'ar', 'UTC')).toBe('1 نوفمبر 2026');
  });
  it('formats date and time (24-hour)', () => {
    expect(formatDateTime(ISO, 'en', 'UTC')).toMatch(/^1 November 2026.*10:06 UTC$/);
    expect(formatDateTime(ISO, 'ar', 'UTC')).toMatch(/^1 نوفمبر 2026.*10:06 UTC$/);
  });
  it('names the time zone: a student signing before arrival may be anywhere in the world', () => {
    expect(formatDateTime(ISO, 'en', 'Asia/Riyadh')).toMatch(/13:06 GMT\+3$/);
    expect(formatDateTime(ISO, 'en', 'America/Los_Angeles')).toMatch(/02:06 (GMT-8|PST)$/);
  });
  it('the date near midnight depends on the zone, so the zone must be shown with the time', () => {
    expect(formatDate('2026-12-31T23:30:00-08:00', 'en', 'UTC')).toBe('1 January 2027');
    expect(formatDate('2026-12-31T23:30:00-08:00', 'en', 'America/Los_Angeles')).toBe('31 December 2026');
  });
  it('never emits Arabic-Indic digits', () => {
    expect(formatDateTime(ISO, 'ar', 'UTC')).not.toMatch(/[٠-٩]/);
  });
});

describe('maskPassport', () => {
  it('keeps only the last four characters', () => {
    expect(maskPassport('N1234567')).toBe('••••4567');
    expect(maskPassport('AB12')).toBe('AB12');
    expect(maskPassport('')).toBe('');
  });
});

import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, maskPassport } from '../../src/lib/format';

const ISO = '2026-11-01T10:06:30.000Z';

describe('formatDate / formatDateTime (Gregorian, Latin digits, both languages)', () => {
  it('formats the date', () => {
    expect(formatDate(ISO, 'en', 'UTC')).toBe('1 November 2026');
    expect(formatDate(ISO, 'ar', 'UTC')).toBe('1 نوفمبر 2026');
  });
  it('formats date and time (24-hour)', () => {
    expect(formatDateTime(ISO, 'en', 'UTC')).toMatch(/^1 November 2026.*10:06$/);
    expect(formatDateTime(ISO, 'ar', 'UTC')).toMatch(/^1 نوفمبر 2026.*10:06$/);
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

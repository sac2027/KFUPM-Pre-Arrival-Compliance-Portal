// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { maskEmail, matchStudent, parseVerifyBody } from '../../functions/lib/verify';

const roster = { passport_number: 'TEST0001', full_name: 'Eyad Salem', phone_e164: '+966500000001', email: 's202368990@kfupm.edu.sa', status: 'active' as const };

describe('parseVerifyBody', () => {
  it('normalises the four fields and rejects missing or malformed ones with one generic code', () => {
    expect(parseVerifyBody({ passportNumber: ' test0001 ', phoneNumber: '00966 50 000 0001', fullName: '  eyad   salem ', email: 'S202368990@KFUPM.edu.sa ' })).toEqual({
      passport: 'TEST0001',
      phone: '+966500000001',
      name: 'eyad salem',
      email: 's202368990@kfupm.edu.sa',
    });
    for (const bad of [{}, { passportNumber: 'TEST0001' }, { passportNumber: 'TEST0001', phoneNumber: '0500000001', fullName: 'x y', email: 'a@b.co' }, { passportNumber: 'TEST0001', phoneNumber: '+966500000001', fullName: 'x y', email: 'nope' }, { passportNumber: 1, phoneNumber: 2, fullName: 3, email: 4 }]) {
      expect(parseVerifyBody(bad)).toBeNull();
    }
  });
});

describe('matchStudent', () => {
  const typed = { passport: 'TEST0001', phone: '+966500000001', name: 'Eyad Salem', email: 's202368990@kfupm.edu.sa' };
  it('matches when all four agree (name loosely)', () => {
    expect(matchStudent(typed, roster)).toBe(true);
    expect(matchStudent({ ...typed, name: 'SALEM EYAD' }, roster)).toBe(true);
  });
  it.each([
    ['phone', { ...typed, phone: '+966500000002' }],
    ['email', { ...typed, email: 'other@kfupm.edu.sa' }],
    ['name', { ...typed, name: 'Eyad Salim' }],
  ])('fails on a different %s', (_f, t) => expect(matchStudent(t, roster)).toBe(false));
  it('fails for a withdrawn student even when everything matches', () => {
    expect(matchStudent(typed, { ...roster, status: 'withdrawn' })).toBe(false);
  });
  it('fails when the roster row is missing', () => expect(matchStudent(typed, null)).toBe(false));
});

describe('maskEmail', () => {
  it('keeps the first letter and the domain', () => {
    expect(maskEmail('s202368990@kfupm.edu.sa')).toBe('s•••@kfupm.edu.sa');
    expect(maskEmail('a@b.co')).toBe('a•••@b.co');
  });
});

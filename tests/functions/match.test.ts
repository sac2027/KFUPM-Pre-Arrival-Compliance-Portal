// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { nameKey, namesMatch, normaliseEmail, normalisePassport, normalisePhone } from '../../functions/lib/match';

describe('normalisePassport', () => {
  it('upper-cases and keeps letters and digits only', () => {
    expect(normalisePassport(' test-0001 ')).toBe('TEST0001');
    expect(normalisePassport('n١٢٣٤٥٦٧')).toBe('N1234567'); // Arabic-Indic digits
  });
});

describe('normalisePhone (E.164 or nothing)', () => {
  it.each([
    ['+966 50 000 0001', '+966500000001'],
    ['00966500000001', '+966500000001'],
    ['+44 (0) 7700 900123', '+447700900123'], // trunk 0 in brackets dropped
    ['+٩٦٦٥٠٠٠٠٠٠٠١', '+966500000001'],
  ])('%s → %s', (input, out) => expect(normalisePhone(input)).toBe(out));
  it.each(['0501234567', '501234567', '+1', '+12345678901234567', 'abc', ''])('rejects %s', (input) => expect(normalisePhone(input)).toBeNull());
});

describe('normaliseEmail', () => {
  it('lower-cases and trims', () => expect(normaliseEmail('  Mai@Example.COM ')).toBe('mai@example.com'));
});

describe('names', () => {
  it('keys a name into comparable tokens', () => {
    expect(nameKey('Mai Nguyễn')).toEqual(['mai', 'nguyen']);
    expect(nameKey("Seán O'Brien-Ó Súilleabháin")).toEqual(['sean', "o'brien", 'o', 'suilleabhain']);
    expect(nameKey('  SARA   AHMED  ')).toEqual(['sara', 'ahmed']);
  });
  it.each([
    ['Mai Nguyễn', 'NGUYEN THI MAI'],
    ['Sara Alqahtani', 'Sara Ahmed Alqahtani'],
    ['anas ammari', 'Anas Ammari'],
    ['Eyad Salem', 'Eyad Salem'],
    ['محمد عبدالله', 'عبدالله محمد'],
  ])('%s matches %s', (a, b) => expect(namesMatch(a, b)).toBe(true));
  it.each([
    ['Mai Nguyen', 'Mai Tran'],
    ['Sara', 'Sara Ahmed Alqahtani'], // one token is not enough when the roster has three
    ['Eyad Salem', 'Eyad Salim'],
    ['', 'Eyad Salem'],
  ])('%s does not match %s', (a, b) => expect(namesMatch(a, b)).toBe(false));
});

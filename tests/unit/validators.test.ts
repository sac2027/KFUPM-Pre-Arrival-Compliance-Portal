import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { normaliseDigits, stripInvisible } from '../../src/lib/normalise';
import { loginSchema, nameSchema, passportSchema, phoneSchema } from '../../src/lib/validators';

const ok = (schema: v.GenericSchema, input: unknown) => v.safeParse(schema, input).success;
const out = (schema: v.GenericSchema, input: unknown) => (v.parse(schema, input) as string);
const msg = (schema: v.GenericSchema, input: unknown) => {
  const r = v.safeParse(schema, input);
  return r.success ? null : r.issues[0]!.message;
};

describe('normaliseDigits', () => {
  it('maps Arabic-Indic and Persian digits to ASCII and tidies whitespace', () => {
    expect(normaliseDigits('٠٥٥١٢٣٤٥٦٧')).toBe('0551234567');
    expect(normaliseDigits('۰۱۲۳۴۵۶۷۸۹')).toBe('0123456789');
    expect(normaliseDigits('  A  1 ')).toBe('A 1');
  });
  it('strips bidi controls and zero-width characters (spoofing)', () => {
    expect(stripInvisible('A\u202E12\u200B3\u2066\uFEFF')).toBe('A123');
  });
});

describe('passport', () => {
  it.each(['A1234567', 'AB12345678', 'ab 123-4567', 'N١٢٣٤٥٦٧'])('accepts %s', (p) => expect(ok(passportSchema, p)).toBe(true));
  it('normalises to upper-case ASCII without spaces or hyphens', () => {
    expect(out(passportSchema, 'ab 123-4567')).toBe('AB1234567');
    expect(out(passportSchema, 'N١٢٣٤٥٦٧')).toBe('N1234567');
  });
  it.each(['P<', 'A123', 'A'.repeat(21), '!!!!!!!!', 'محمد12345'])('rejects %s', (p) => expect(msg(passportSchema, p)).toBe('error.passport'));
  it('reports empty as required', () => expect(msg(passportSchema, '  ')).toBe('error.required'));
});

describe('phone', () => {
  it.each(['+966 55 123 4567', '+44 7700 900123', '0551234567', '(055) 123-4567', '+٩٦٦ ٥٥ ١٢٣ ٤٥٦٧'])('accepts %s', (p) => expect(ok(phoneSchema, p)).toBe(true));
  it('normalises to an optional + and ASCII digits only', () => {
    expect(out(phoneSchema, '+966 55 123 4567')).toBe('+966551234567');
    expect(out(phoneSchema, '+٩٦٦ ٥٥ ١٢٣ ٤٥٦٧')).toBe('+966551234567');
  });
  it.each(['abc', '123', '+1234567890123456', '55+1234567', '++96655123'])('rejects %s', (p) => expect(msg(phoneSchema, p)).toBe('error.phone'));
  it('reports empty as required', () => expect(msg(phoneSchema, '')).toBe('error.required'));
});

describe('name', () => {
  it.each(['محمد عبدالله الغامدي', 'Nguyễn Thị Mai', "O'Brien-Smith", 'Łukasz Müller', 'ٹھاکر علی', 'Zoë Ó Briain', 'Jean-Luc Picard Jr.'])('accepts %s', (n) => expect(ok(nameSchema, n)).toBe(true));
  it.each(['12345', 'A', '   ', '1 2 3', 'Mai <script>', 'a'.repeat(101)])('rejects %j', (n) => expect(ok(nameSchema, n)).toBe(false));
  it('accepts exactly 100 characters and keeps a very long unbroken Arabic name', () => {
    expect(ok(nameSchema, 'م'.repeat(100))).toBe(true);
  });
  it('collapses whitespace and strips invisible bidi characters', () => {
    expect(out(nameSchema, '  Mai\u202E   Nguyễn \u200B')).toBe('Mai Nguyễn');
  });
  it('reports empty as required, malformed as error.name', () => {
    expect(msg(nameSchema, '')).toBe('error.required');
    expect(msg(nameSchema, '12345')).toBe('error.name');
  });
});

describe('loginSchema', () => {
  it('returns normalised values for all three fields', () => {
    expect(v.parse(loginSchema, { passportNumber: 'a1234567', phoneNumber: '+966 55 123 4567', fullName: ' محمد  عبدالله ' })).toEqual({
      passportNumber: 'A1234567',
      phoneNumber: '+966551234567',
      fullName: 'محمد عبدالله',
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  MAX_SIGNATURE_BYTES,
  MIN_STROKE_LENGTH,
  sniffImageType,
  strokeLength,
  totalStrokeLength,
  validateSignatureFile,
} from '../../src/lib/signature';

const file = (type: string, size: number) => ({ type, size });
const blobOf = (bytes: number[], type = 'application/octet-stream') => new Blob([new Uint8Array(bytes)], { type });

describe('validateSignatureFile', () => {
  it('accepts PNG and JPEG up to the limit', () => {
    expect(validateSignatureFile(file('image/png', 100 * 1024))).toEqual({ ok: true });
    expect(validateSignatureFile(file('image/jpeg', MAX_SIGNATURE_BYTES))).toEqual({ ok: true });
  });
  it.each([
    ['image/svg+xml', 'type'],
    ['application/pdf', 'type'],
    ['image/gif', 'type'],
    ['text/html', 'type'],
    ['', 'type'],
  ])('rejects %s as %s', (mime, reason) => {
    expect(validateSignatureFile(file(mime, 1000))).toEqual({ ok: false, reason });
  });
  it('rejects oversize and empty files', () => {
    expect(validateSignatureFile(file('image/png', 3 * 1024 * 1024))).toEqual({ ok: false, reason: 'size' });
    expect(validateSignatureFile(file('image/png', MAX_SIGNATURE_BYTES + 1))).toEqual({ ok: false, reason: 'size' });
    expect(validateSignatureFile(file('image/png', 0))).toEqual({ ok: false, reason: 'empty' });
  });
});

describe('sniffImageType (trust the bytes, not the label)', () => {
  it('recognises PNG and JPEG signatures', async () => {
    expect(await sniffImageType(blobOf([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(await sniffImageType(blobOf([0xff, 0xd8, 0xff, 0xe0, 0, 0x10]))).toBe('jpeg');
  });
  it('rejects HTML, SVG and empty data even if the file claims to be an image', async () => {
    expect(await sniffImageType(blobOf([...new TextEncoder().encode('<html><script>alert(1)</script>')], 'image/png'))).toBeNull();
    expect(await sniffImageType(blobOf([...new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')], 'image/png'))).toBeNull();
    expect(await sniffImageType(blobOf([]))).toBeNull();
  });
});

describe('strokeLength', () => {
  const p = (x: number, y: number) => ({ x, y });
  it('measures the path length of one stroke', () => {
    expect(strokeLength([p(0, 0), p(30, 40)])).toBe(50);
    expect(strokeLength([p(0, 0), p(10, 0), p(10, 10)])).toBe(20);
  });
  it('is zero for a dot or nothing', () => {
    expect(strokeLength([p(5, 5)])).toBe(0);
    expect(strokeLength([])).toBe(0);
  });
  it('adds up strokes, and a signature needs at least the minimum', () => {
    const accidentalDot = [[p(0, 0), p(1, 1)]];
    expect(totalStrokeLength(accidentalDot)).toBeLessThan(MIN_STROKE_LENGTH);
    const real = [[p(0, 0), p(30, 0)], [p(0, 10), p(30, 10)]];
    expect(totalStrokeLength(real)).toBe(60);
    expect(totalStrokeLength(real)).toBeGreaterThanOrEqual(MIN_STROKE_LENGTH);
    expect(MIN_STROKE_LENGTH).toBe(40);
  });
});

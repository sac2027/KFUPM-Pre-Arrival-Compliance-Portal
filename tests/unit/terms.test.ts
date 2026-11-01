import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import raw from '../../src/data/compliance-terms.json';
import { loadTerms } from '../../src/lib/terms';
import { TERM_IDS, parseTerms, termText } from '../../src/lib/termsSchema';

const terms = loadTerms();

describe('compliance-terms.json', () => {
  it('has exactly the five terms in the mandated order', () => {
    expect(terms.terms.map((t) => t.id)).toEqual([
      'saudi-laws',
      'cultural-norms',
      'university-policies',
      'representation',
      'reporting',
    ]);
    expect([...TERM_IDS]).toEqual(terms.terms.map((t) => t.id));
  });

  it('has non-empty English and Arabic for every user-visible string', () => {
    for (const t of terms.terms) {
      for (const loc of ['en', 'ar'] as const) {
        expect(t.title[loc].trim(), `${t.id} title ${loc}`).not.toBe('');
        expect(termText(t, loc, terms.links).trim().length, `${t.id} body ${loc}`).toBeGreaterThan(40);
      }
    }
    for (const loc of ['en', 'ar'] as const) {
      expect(terms.document.title[loc]).toBeTruthy();
      expect(terms.document.intro[loc]).toBeTruthy();
      expect(terms.document.closing[loc]).toBeTruthy();
    }
  });

  it('resolves every linkId and uses https URLs only', () => {
    for (const t of terms.terms) {
      for (const loc of ['en', 'ar'] as const) {
        for (const seg of t.body[loc]) {
          if ('linkId' in seg) expect(terms.links[seg.linkId], seg.linkId).toBeDefined();
        }
      }
    }
    for (const [id, link] of Object.entries(terms.links)) {
      expect(link.url, id).toMatch(/^https:\/\//);
      expect(link.label.en && link.label.ar, id).toBeTruthy();
    }
  });

  it('references the same links in English and Arabic of each term', () => {
    for (const t of terms.terms) {
      const ids = (loc: 'en' | 'ar') =>
        t.body[loc].filter((s) => 'linkId' in s).map((s) => (s as { linkId: string }).linkId);
      expect(ids('ar'), t.id).toEqual(ids('en'));
    }
  });

  it('applies the docx tracked change to term 3 (appearance, spelled correctly)', () => {
    const en = termText(terms.terms[2]!, 'en', terms.links);
    expect(en).toContain('appearance');
    expect(en).not.toContain('apperance');
  });

  it('records document ref and stage', () => {
    expect(terms.document.ref).toBe('KFUPM-INTL-PACF');
    expect(terms.document.stage).toBe('Pre-Arrival');
  });

  it('rejects a term missing its Arabic title and names the path', () => {
    const bad = structuredClone(raw) as unknown as { terms: Array<{ title: Record<string, unknown> }> };
    delete bad.terms[1]!.title.ar;
    expect(() => parseTerms(bad)).toThrow(/terms\.1\.title\.ar/);
  });

  it('rejects a body that references an unknown link', () => {
    const bad = structuredClone(raw) as typeof raw;
    (bad.terms[0]!.body.en as unknown[]).push({ linkId: 'does-not-exist' });
    expect(() => parseTerms(bad)).toThrow(/does-not-exist/);
  });

  it('rejects an http (non-TLS) URL', () => {
    const bad = structuredClone(raw) as typeof raw;
    Object.values(bad.links)[0]!.url = 'http://example.com';
    expect(() => parseTerms(bad)).toThrow(/https/);
  });
});

describe('content decoupling', () => {
  /** No policy copy or external URL may live in a component: it belongs in compliance-terms.json. */
  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : p.endsWith('.tsx') ? [p] : [];
    });
  }
  it('has no https URLs or policy phrases in any .tsx file', () => {
    for (const f of walk('src')) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toMatch(/https?:\/\//);
      expect(src, f).not.toMatch(/Public Decency|Visit Saudi|disciplinary action/i);
    }
  });
});

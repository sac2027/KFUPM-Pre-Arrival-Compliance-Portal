/* Run with `npm run validate:terms`. Exits 1 on schema errors; warnings never fail the build. */
import { readFileSync } from 'node:fs';
import { parseTerms } from '../src/lib/termsSchema.ts';

const file = new URL('../src/data/compliance-terms.json', import.meta.url);
let terms;
try {
  terms = parseTerms(JSON.parse(readFileSync(file, 'utf8')));
} catch (err) {
  console.error(`✖ ${(err as Error).message}`);
  process.exit(1);
}

console.log(`✔ compliance-terms.json is valid (${terms.terms.length} terms, ${Object.keys(terms.links).length} links)`);

const warnings: string[] = [];
for (const [id, l] of Object.entries(terms.links)) {
  if (l.status !== 'verified') warnings.push(`link "${id}" is ${l.status}: ${l.url}`);
}
for (const loc of ['en', 'ar'] as const) {
  if (terms.meta.reviewStatus[loc] !== 'approved') warnings.push(`${loc.toUpperCase()} text is "${terms.meta.reviewStatus[loc]}"`);
}
if (warnings.length) {
  console.warn(`\n⚠ ${warnings.length} item(s) to resolve before launch:`);
  for (const w of warnings) console.warn(`  - ${w}`);
}

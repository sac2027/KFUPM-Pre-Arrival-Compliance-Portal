# Break-UI stress report

Method: the `break-ui` skill. Phase 1 mapped every value the app renders and its limit. Phase 2 built one worst-case
dataset from the skill's catalogue, entering through the same boundaries as real data (staff-edited JSON, the SSO's name,
the backend's reference number). Phase 3 added a dev-only toggle (`npm run dev`, then `/?data=worst`; never in production).
Phase 4 broke it at 1280 / 360 / 320 px, in English and Arabic, with 200% text, forced colours, no JavaScript and print.
Everything below was verified in a real browser; the regression tests are in `tests/e2e/worst-case.spec.ts`,
`tests/e2e/edge-cases.spec.ts`, `tests/unit/worst-case.test.ts`.

## Part 1: what broke (all fixed)

| # | Severity | Field | Worst-case value | What happened | Fix |
| --- | --- | --- | --- | --- | --- |
| 1 | Broken | name | `نامه‌ای احمدی` (Persian, with a zero-width non-joiner); Malayalam with a joiner | The joiner was stripped (name silently respelled) or the name rejected | Keep U+200C/U+200D in names; strip only spoofing characters (`src/lib/normalise.ts`, `validators.ts`) |
| 2 | Broken | name | `阿卜杜拉·本·穆罕默德` | Rejected: the middle dot used in transliterated names was not allowed | Allow U+00B7 and U+30FB |
| 3 | Broken | signature upload | blank white page; 1×1 pixel; white ink on transparent | Accepted as a valid signature | `assessImage` rejects small and blank images, with messages (`src/lib/signature.ts`) |
| 4 | Broken | all steps | text enlarged to 200% on a phone | The whole form grew wider than the screen: button `min-inline-size`, grid columns sized to the longest word, masthead toggle, a tab row that could not wrap | `minmax(0,1fr)` columns, `overflow-wrap: anywhere`, wrapping masthead and tabs |
| 5 | Broken | terms | short screen (320×640) with large text | The sticky progress bar covered the term being read and blocked its click | Sticky only when the screen is taller than 700 px |
| 6 | Broken | whole page | JavaScript disabled | Blank page | `<noscript>` message in both languages |
| 7 | Ugly | receipt reference | 64 unbroken characters | Fit, but in a sliver beside its label: 8 short lines at 24 px | Label above value on narrow screens, calmer size, select-all on click |
| 8 | Fragile | printed time | `13:15` with no zone | A student signing from abroad gets an ambiguous time on a legal document | Time zone appended (`13:15 GMT+3`) |
| 9 | Fragile | progress, checkbox, buttons | forced-colours (high contrast) mode | State carried by background colour disappeared | `src/styles/a11y.css` restates it with system colours |
| 10 | Fragile | page | OS "force dark" | Light-only brand surfaces could be inverted | `color-scheme: light` |

Also added: `npm run validate:terms` now warns when staff-written text is long enough to cause trouble
(title > 110 characters, text > 1,200, URL > 500).

## Part 2: decisions for you

1. **Name length.** The form accepts up to 100 letters; the input's `maxLength` is 200 on purpose, so a longer name shows an
   error instead of being silently truncated. The SSO may return up to ~255 (handled: the layout wraps it). *Recommend:* ask
   IT for the real column limit and set the schema to match.
2. **Digits in names** are rejected. *Recommend:* keep (legal names with digits are vanishingly rare, and it blocks mistakes
   such as pasting a phone number into the name field).
3. **Reload or Back mid-form** loses progress, and Back leaves the site (there is no per-step history). This protects
   privacy (nothing is stored). *Recommend:* keep nothing in storage, but add a "leave this page?" prompt while on the
   terms and signature steps.
4. **Very long staff text** works on screen at every width and prints across several pages, always keeping the closing
   statement with the signature. *Recommend:* treat the new validator warnings as a review checklist.
5. **Dark mode** is not supported (brand surfaces are light). *Recommend:* keep.

## Part 3: what held up

- The whole flow with stress data at 1280 / 360 / 320 px in English and Arabic: no horizontal overflow, no clipped text.
- 100 unbroken Arabic letters in the name, a 20-character passport, a 15-digit phone.
- A 200-character name from the SSO, a 64-character receipt id, an 80-letter unbroken policy code, 400+ character URLs.
- `<script>`, `&amp;`, `**bold**` and `{n} of {total}` in staff text render as literal text; nothing executes.
- Uploads of 4000×200, 200×4000 and 8000×6000 images are downscaled, undistorted and fit their preview.
- RTL, the language toggle mid-flow, reduced motion, and the printed PDF.
- The production bundle contains none of the stress data, the toggle or the dev hooks (a test builds it and searches it).

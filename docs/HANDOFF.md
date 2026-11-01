# Hand-off guide

For Student Affairs staff (wording), KFUPM IT (real systems and deployment), and whoever maintains this next.

## What this is

A static single-page app (Vite, React, TypeScript) served by Cloudflare. A student goes through four steps:
**sign in** (passport number, phone number, full name) → **confirm five terms** → **sign** (draw, or upload an image)
→ **receipt** (reference number, and a printable signed declaration). Everything the student types stays in the
browser's memory; nothing is written to storage, URLs or logs. The two places that talk to the outside world are
deliberately small and replaceable (section 3), and are mocks today.

## 1. For Student Affairs staff: editing the wording

All policy wording, the three external links, and the document title live in **one file**:
`src/data/compliance-terms.json`. You never need to touch the screens.

```jsonc
{
  "meta":     { "reviewStatus": { "en": "needs-review", "ar": "needs-review" } },  // set to "approved" once signed off
  "document": { "ref": "KFUPM-INTL-PACF", "stage": {...}, "title": {...}, "intro": {...}, "closing": {...} },
  "links": {                                  // every external URL is defined once, here
    "pdr-pdf": { "url": "https://…", "label": { "en": "…", "ar": "…" }, "status": "unverified" }  // → "verified" when checked
  },
  "terms": [                                  // exactly five, in this order: saudi-laws, cultural-norms,
    { "id": "saudi-laws",                     //   university-policies, representation, reporting
      "title": { "en": "…", "ar": "…" },
      "body":  { "en": [ { "text": "…" }, { "strong": "bold words" }, { "linkId": "pdr-pdf" } ],
                 "ar": [ … ] } }
  ]
}
```

- A body is a list of pieces: plain `text`, `strong` (bold) and `linkId` (a link defined under `links`). The English and
  Arabic bodies of a term must refer to the same links.
- After editing, run `npm run validate:terms`. It rejects a broken file with the exact path of the problem, and warns about
  anything that should be resolved before launch (unverified links, wording not yet marked `approved`, very long text).
- Never type a URL or policy sentence anywhere else: a test fails if one appears in the screens' code.
- The English intro and terms 1–2 match the legacy Google Site word for word (a test pins this). If KFUPM approves new
  wording, change the JSON **and** the matching strings in `tests/unit/terms.test.ts` in the same change.
- The Arabic was drafted by the build team and is marked `needs-review`: it must be reviewed by KFUPM before launch.
- Changes go live when they are merged and deployed (section 4).

## 2. User-interface text (not policy)

Labels, buttons and error messages are in `src/i18n/en.json` and `src/i18n/ar.json`. Both files must have the same keys
(a test enforces it). `{n}` style placeholders are filled in by the code.

## 3. For IT: connecting the real systems

The screens only use two files. Replace what they export; nothing else changes.

| File | Replace | Contract |
| --- | --- | --- |
| `src/services/authService.ts` | `authService` | `login({ passportNumber, phoneNumber, fullName }) → Session` (`sessionId`, the student, `issuedAt` ISO time). Reject with `new ServiceError('invalid_credentials', …)` when the student cannot be verified, or `'network'` for an outage. `logout()` is called when the student clicks Finish. |
| `src/services/dbService.ts` | `dbService` | `submitCompliance(payload) → { referenceNumber, receivedAt }`. Reject with `'invalid_submission'` or `'network'`. |

Types are in `src/services/types.ts`. The payload sent on submission is: the session (including the student's
details), the language, the document ref, the five accepted term ids, the signature (`method` and a PNG/JPEG data
URL), and the signing time.

**The backend must not trust the browser.** Re-check everything server-side: exactly the five term ids in order; the
signature is a PNG or JPEG of reasonable size; the fields are valid. Encrypt the passport number, phone number, name and
signature at rest, never log the payload, and return only the reference number and time.

- Two things the mocks do that a real service may not: the name is limited to 100 letters by the form (the SSO may allow
  more: the layout copes with up to ~255), and the receipt id may be any unbroken text (a 64-character hash is fine).
- If sign-in becomes a redirect to KFUPM SSO rather than a form, replace `src/features/login/LoginScreen.tsx` and keep
  the `Session` it produces.
- When the backend or SSO has its own address, add it to **`connect-src`** in `public/_headers`, otherwise the browser
  will block the call. The test `tests/e2e/csp.spec.ts` runs the whole flow under that policy.
- Cross-origin calls also need CORS on the backend; same-origin calls (a Cloudflare Worker route) need neither.

## 4. Deploying to Cloudflare

Needs a Cloudflare account and an API token with Workers permission. Nothing was deployed from the build environment.

```bash
npm ci
npm run release:check            # tests, strict wording check, production build
npx wrangler login               # or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
npx wrangler deploy              # publishes ./dist as Workers static assets (see wrangler.jsonc)
```

Attach the university's domain in the Cloudflare dashboard (Workers → this project → Domains). Security headers and
caching come from `public/_headers` (strict Content-Security-Policy, no framing, no referrer, one-year caching for
fingerprinted files). `npx wrangler rollback` returns to the previous version.

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs the checks and the browser tests on every push. It does not
deploy; add a deploy step with your own secrets when you decide how releases should work.

## 5. Tests

| Command | What it covers |
| --- | --- |
| `npm run verify` | Types, lint, ~200 unit tests, terms-file schema; includes a test that builds the production bundle and proves none of the stress-test tooling ships |
| `npm run test:e2e` | ~250 real-browser tests: both languages, 320 / 360 / 768 / 1280 / 1920 px, keyboard only, accessibility (axe), failure and retry, the printed PDF, the security policy |
| `npm run release:check` | Both of the above, the strict wording gate, and a production build |

The browser tests need Chromium (`npx playwright install chromium`) and `poppler-utils` (they read the generated PDF).
To see the stress data, run `npm run dev` and open `/?data=worst` (dev builds only).

## 6. Brand assets and fonts

- `public/brand/`: Full Stacked lockup (unaltered), two FAST Matrix exports, and the seal. **The seal in the repo is the old
  one and must be replaced with the official Primary or Secondary seal (Brand Guidelines §4.2).** It appears only on the
  printed declaration.
- No Arabic version of the lockup was supplied, so Arabic mode uses the English lockup.
- `public/fonts/`: KFUPM Display (served exactly as supplied; its licence forbids modification or reproduction, so **keep
  this repository private**) and IBM Plex Sans Arabic (open licence).
- Rules baked into tests: the lockup and Matrix are never altered, the Matrix is never mirrored in Arabic, and the display
  font never renders text a student typed.

## 7. Before launch

- [ ] KFUPM reviews the Arabic wording and the English wording; set `meta.reviewStatus` to `approved`.
- [ ] Verify the three links open the right documents; set each `status` to `verified`. The docx notes the Ministry of
      Interior link as not working; the alternative URL is recorded in the `note` field.
- [ ] Replace the seal with the official artwork; decide whether an Arabic lockup is needed.
- [ ] Confirm the name length limit with whoever owns the SSO or database (the form allows 100 letters).
- [ ] Connect the real `authService` and `dbService`; update `connect-src`.
- [ ] Decide the open questions in `docs/qa/break-ui.md` (Back button and reload behaviour, and the others listed there).
- [ ] `npm run release:check` passes (the strict wording gate stays red until the items above are done).
- [ ] Confirm the repository is private.
- [ ] Attach the domain and deploy.

## 8. Where things are

```
src/data/compliance-terms.json   all policy wording and links          src/features/   one folder per step
src/i18n/                        interface text (en, ar)               src/services/   the two replaceable files
src/lib/                         validation, formatting, signatures    src/styles/     tokens, shell, forms, print
public/_headers                  security headers and caching          docs/           plan, design, audits
```

# KFUPM Pre-Arrival Compliance Portal

The bilingual (English / Arabic) form international students complete before arriving at KFUPM: they sign in,
confirm five terms, and sign. It replaces the legacy Google Sites form and is built to be deployed on Cloudflare.

- **Staff editing the wording, IT connecting real systems, deploying:** read [`docs/HANDOFF.md`](docs/HANDOFF.md).
- Design decisions: [`docs/superpowers/specs`](docs/superpowers/specs). Plan: [`docs/superpowers/plans`](docs/superpowers/plans).
- Stress-test and accessibility findings: [`docs/qa/break-ui.md`](docs/qa/break-ui.md), [`docs/audit.md`](docs/audit.md).

```bash
npm ci
npm run dev          # http://localhost:5173
npm run verify       # types, lint, unit tests, terms-file check
npm run test:e2e     # real-browser tests (needs Chromium and poppler-utils)
npm run release:check  # everything above, plus the strict launch gate, plus a production build
```

# KFUPM Pre-Arrival Compliance Portal

Bilingual (EN LTR / AR RTL) Vite + React + TypeScript app replacing the legacy Google Sites form. Deployed to Cloudflare Workers static assets. Plan: `docs/superpowers/plans/2026-11-01-kfupm-pre-arrival-portal.md` (its **Global Constraints** apply to every task). Design: `docs/superpowers/specs/2026-11-01-kfupm-portal-design.md`.

## Commands
`npm run verify` (typecheck + lint + unit tests + terms validation) must be green before every commit. `npm run test:e2e` runs Playwright. One atomic commit per plan task.

## Hard rules
- All policy text and external URLs live only in `src/data/compliance-terms.json`. No policy string or URL in `.tsx`.
- UI talks to I/O only through `src/services/authService.ts` and `dbService.ts` (the IT hand-off seams).
- CSS logical properties only; no `left`/`right` in component CSS. Animate `transform`/`opacity` only; honour `prefers-reduced-motion`.
- PII (passport, phone, name, signature) is memory-only: never in URLs, storage, or `console.*`.
- Brand: use the supplied Full Stacked lockup and KFUPM Matrix unaltered. The KFUPM font is served as supplied (licence forbids modification/reproduction) and never renders user-entered text (ASCII-only coverage). Green `#009767` is never body text.

## Skills by phase (load when the phase starts; they persist for the session, re-load after a context reset)
- Planning / architecture: writing-plans, brainstorming, graphify (after the scaffold exists)
- Visual design (Tasks 6-9): frontend-design, design-taste-frontend, impeccable
- Motion and micro-interactions (Tasks 8-10, 12): emil-design-eng, animate
- Stress and audit (Tasks 12-13): break-ui, web-design-guidelines
- Tests (Task 14): playwright-skill

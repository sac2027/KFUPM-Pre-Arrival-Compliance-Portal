# Architecture map

A snapshot (2026-11-01) of how `src/` fits together, built with graphify from the code itself:
189 symbols, 454 relationships, every one read directly from the source (none inferred by a model), 10 clusters.

- Open **`graph.html`** in a browser for the interactive map (no server needed).
- **`GRAPH_REPORT.md`** is the generated report: clusters, the most-connected symbols, and the questions the graph suggests.

## How to read it

| Cluster | What it is |
| --- | --- |
| App shell and step flow | `App`, the masthead, language toggle, `StepPanel`, and the step state machine |
| Login form and input validation | the login screen and `src/lib/validators.ts` |
| Policy terms | `compliance-terms.json`, its loader and schema, and the term cards |
| Signature step | draw pad, upload zone, tabs, and the shared `Button` |
| Receipt and printable declaration | the receipt screen, the print sheet, date formatting |
| Mock services and dev stress hooks | `authService.ts` and `dbService.ts` (the two files IT replaces) and the dev-only helpers |
| Language and i18n | the provider, the dictionaries, locale detection |

## What it tells us

- **No import cycles.** Dependencies run one way: screens → components and libraries → data and services.
- **The core abstractions are the right ones.** `useI18n()` (27 links) is the most connected symbol, then `Shell`,
  `Button`, `Session` and `TermId`: language, the page frame, the one shared control, and the two shared types.
- **The weak "cohesion" scores and "should this be split?" suggestions are mostly an artifact of those shared hubs.** Every
  screen uses `useI18n` and `Button`, which makes clusters look loosely coupled to each other. They are not candidates for
  splitting.
- **One real coupling to know about:** the two replaceable service files import small dev-only helpers
  (`src/dev/worstCase.ts`), and `src/lib/terms.ts` imports the dev stress fixture. All of it is guarded by
  `import.meta.env.DEV` and removed from the production bundle (a test proves it). When IT replaces `authService.ts` and
  `dbService.ts`, those imports go with them, and nothing else needs to change.

## Regenerating

The map is a snapshot and will drift as the code changes. To rebuild it: `pip install graphifyy`, then run graphify's
pipeline on `src/` (code only, so no AI extraction is needed).

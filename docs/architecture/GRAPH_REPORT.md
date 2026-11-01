# Graph Report - src  (2026-11-01)

## Corpus Check
- Corpus is ~11,386 words - fits in a single context window. You may not need a graph.

## Summary
- 189 nodes · 454 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Signature step (draw, upload, buttons)
- Login form and input validation
- Receipt and printable declaration
- Policy terms (JSON, loader, term cards)
- App shell and step flow
- Mock services and dev stress hooks
- Language and i18n
- Entry point and stylesheets
- Colour palette and contrast rules
- Contrast calculation

## God Nodes (most connected - your core abstractions)
1. `useI18n()` - 27 edges
2. `Shell()` - 13 edges
3. `Button()` - 13 edges
4. `isWorstCase()` - 9 edges
5. `I18nProvider()` - 8 edges
6. `TermId` - 8 edges
7. `Session` - 8 edges
8. `LoginScreen()` - 7 edges
9. `PrintSheet()` - 7 edges
10. `ReceiptScreen()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Shell()` --indirect_call--> `flowReducer()`  [INFERRED]
  App.tsx → state/flow.ts
- `Shell()` --calls--> `LoginScreen()`  [EXTRACTED]
  App.tsx → features/login/LoginScreen.tsx
- `Shell()` --calls--> `SignatureStep()`  [EXTRACTED]
  App.tsx → features/signature/SignatureStep.tsx
- `App()` --calls--> `I18nProvider()`  [EXTRACTED]
  App.tsx → i18n/I18nProvider.tsx
- `LoginScreen()` --calls--> `Button()`  [EXTRACTED]
  features/login/LoginScreen.tsx → components/Button.tsx

## Import Cycles
- None detected.

## Communities (10 total, 2 thin omitted)

### Community 0 - "Signature step (draw, upload, buttons)"
Cohesion: 0.12
Nodes (24): Button(), DrawPad(), SignatureStep(), UploadZone(), MessageKey, assessImage(), ImageVerdict, inkRatio() (+16 more)

### Community 1 - "Login form and input validation"
Cohesion: 0.13
Nodes (18): Field(), FieldProps, LoginScreen(), resolver(), asciiDigits(), normaliseDigits(), stripAllInvisible(), stripInvisible() (+10 more)

### Community 2 - "Receipt and printable declaration"
Cohesion: 0.17
Nodes (21): Plain(), PrintSheet(), TERMS, formatDate(), formatDateTime(), maskPassport(), tag(), Locale (+13 more)

### Community 3 - "Policy terms (JSON, loader, term cards)"
Cohesion: 0.14
Nodes (16): Body(), TermCard(), TERMS, loadTerms(), bilingual, body, ComplianceTerms, link (+8 more)

### Community 4 - "App shell and step flow"
Cohesion: 0.20
Nodes (15): App(), Shell(), TERMS, LanguageToggle(), Masthead(), StepPanel(), Stepper(), WorstCaseToggle() (+7 more)

### Community 5 - "Mock services and dev stress hooks"
Cohesion: 0.22
Nodes (14): failed, isWorstCase(), shouldFailOnce(), WORST_FULL_NAME, WORST_REFERENCE, createMockAuthService(), assertValid(), createMockDbService() (+6 more)

### Community 6 - "Language and i18n"
Cohesion: 0.18
Nodes (12): detectLocale(), DICTS, Dir, format(), I18nContext, I18nProvider(), I18nValue, Locale (+4 more)

### Community 8 - "Colour palette and contrast rules"
Cohesion: 0.29
Nodes (6): ColorName, Pairing, PAIRINGS, PALETTE, THRESHOLD, Use

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useI18n()` connect `App shell and step flow` to `Signature step (draw, upload, buttons)`, `Login form and input validation`, `Receipt and printable declaration`, `Policy terms (JSON, loader, term cards)`, `Language and i18n`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Should `Signature step (draw, upload, buttons)` be split into smaller, more focused modules?**
  _Cohesion score 0.11931818181818182 - nodes in this community are weakly interconnected._
- **Why does `AuthService` connect `Login form and input validation` to `Receipt and printable declaration`, `Mock services and dev stress hooks`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Should `Login form and input validation` be split into smaller, more focused modules?**
  _Cohesion score 0.12615384615384614 - nodes in this community are weakly interconnected._
- **Why does `Button()` connect `Signature step (draw, upload, buttons)` to `Login form and input validation`, `Receipt and printable declaration`, `Policy terms (JSON, loader, term cards)`, `App shell and step flow`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Should `Policy terms (JSON, loader, term cards)` be split into smaller, more focused modules?**
  _Cohesion score 0.1383399209486166 - nodes in this community are weakly interconnected._
- **Should `Entry point and stylesheets` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
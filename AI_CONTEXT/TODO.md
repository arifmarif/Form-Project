# TODO

> Every item below was found in source code, configuration, the PRD or in the code-review work done on
> 2026-10-02. Nothing is invented. PRD references are section numbers in
> `form-builder-calculation-platform-prd.md`.

## Critical

- [ ] Build the calculation engine module (`src/lib/calculation/`): tokenizer, recursive-descent parser
      → AST, built-in functions (§24), dependency graph (§31), circular dependency detection (§32),
      evaluator (§79). No `eval`, no `new Function` (§28, §75).
      → Exact spec in `AI_CONTEXT/CURRENT_STATE.md` → Exact Next Step.
- [ ] Unit tests for the calculation engine (`src/tests/calculation.test.ts`): all operators (§23),
      built-ins (§24), chained formulas (the seeded `subtotal → discount_amount → tax_amount →
      grand_total` case), circular reference rejection, unknown field rejection.
- [ ] Public form route `src/app/f/[slug]/page.tsx` (§38, §39): render a `PUBLISHED` form with
      `FormRenderer mode="public"`, 404 for unknown slug and non-published status.
- [ ] Submission action (§41, §42): public route → server action → load the stored `FormVersion`,
      run `validateFormValues` **server-side**, recalculate every formula, then one transaction that
      inserts `Response` (+ `ResponseAnswer` rows via `normalizeFormValues`), `CalculationResult` rows,
      increments `Form.responseCount`, and writes an `AuditLog` entry.
- [ ] Publish / unpublish actions (§39, §40): transition `FormStatus` between `DRAFT`, `PUBLISHED`,
      `CLOSED` with a server action, surfaced in the form detail page.
- [ ] Stop the preview banner from claiming calculations run before the engine exists
      (`src/components/form-renderer/form-renderer.tsx:178`).

## In Progress

- [x] Portable AI context documentation (`AGENTS.md` + `AI_CONTEXT/`, 7 documents) — written and
      cross-checked against the source on 2026-10-02. Keep it in sync with every subsequent task;
      `npm run verify` was re-run green after the documentation edits.

## Next

- [ ] Realtime calculation in `FormRenderer`: recompute calculation fields on every value change and
      render them through `formatFieldValue` (§33, §34). Recompute only, never accept client-supplied
      calculation values.
- [ ] Response list, detail, edit and CSV export (§43–§48). `/forms/[formId]/responses` is a
      placeholder card; `/responses` currently queries `prisma.response` straight from the page.
- [ ] Response filtering (§46), search (§47), edit with version-safe recalculation (§45).
- [ ] Move `src/app/(app)/responses/page.tsx` off direct `prisma` access onto a
      `response-service.ts`, restoring the page → service → data rule used everywhere else.
- [ ] Resolve PRD §17 dual-storage gaps (see `CURRENT_STATE.md` → Issue 1): populate `Field.sectionId`
      in `saveFormSchema`, and rebuild `Section`/`Field`/`FieldOption`/`Formula` rows in
      `duplicateForm`. Either complete the relational write path or stop writing those rows and treat
      `FormVersion.schema` as the only source of truth.
- [ ] Add `src/server/services/response-service.ts` and keep the calculation results transactional
      with the response insert (§42).
- [ ] Fix `FormStatus` / `StatusBadge` usage in the form detail page: publish state has no UI control yet.

## Planned

PRD milestone items that are scoped but not started:

- [ ] Builder drag & drop ordering (§15) — currently "Move up" / "Move down" buttons only.
- [ ] Builder autosave (§56) — currently an explicit "Save fields" button.
- [ ] Builder undo / redo (§57).
- [ ] Section editing UI in the builder (§16) — `FieldEditor` keeps loaded `sections` verbatim and
      cannot create, rename or reorder them.
- [ ] Formula builder UI (§25), formula autocomplete (§26), formula validation feedback (§27).
- [ ] Scoring engine (§37).
- [ ] Templates (§59).
- [ ] Optimized recalculation using the dependency graph (§34).
- [ ] E2E tests (§70, PRD §83 manual checklist).
- [ ] Integration tests for the service layer (§70).
- [ ] Security audit pass: §55 API security, §62 security requirements.
- [ ] Performance pass (§63).
- [ ] Templates/theme picker beyond the three `formThemeSchema` knobs (§40).
- [ ] Email verification and password reset — tables exist, no flow (§7 does not require it for MVP).
- [ ] Admin role wiring — `Role.ADMIN` exists but grants nothing.
- [ ] Rewrite `README.md` from `PROJECT_CONTEXT.md` (setup, Docker, `db:generate`, seed, LAN host,
      `npm run verify`). Tracked under Technical Debt as well.

## Bugs

- [ ] None currently known. The `/forms/new` 500 (non-async export in a `"use server"` module) is
      fixed and verified; see `CHANGELOG.md` 2026-10-02.

## Technical Debt

- [ ] `Section.fieldId` is a confusing column name: it stores the schema-level section id, not a
      field reference (`prisma/schema.prisma:153`). Confusing next to `Field.fieldId`. Renaming means
      a migration and updates in `saveFormSchema` + `prisma/seed.ts`.
- [ ] `form-service.ts` is ~330 lines with five transactions; consider splitting schema persistence
      into its own module when the engine and responses land.
- [ ] `src/app/(app)/responses/page.tsx` imports `@/lib/db` directly, bypassing the service layer.
- [ ] `README.md` is still the `create-next-app` default — no setup, seed, Docker or LAN instructions.
      The required env vars are documented in `.env.example`, which is now committed.
- [ ] `duplicateForm` copies the schema JSON but not the relational rows (see Next).
- [ ] Response `ipHash` / `userAgent` columns and `FormSettings.captchaEnabled` / `rateLimit` /
      `submissionLimit` / `startDate` / `endDate` / `storeResponses` / `requireLogin` are all
      persisted but unenforced — they need behaviour when the submission path exists.
- [ ] `prisma/seed.ts` duplicates the field-type → enum mapping that `form-service.ts` also owns
      (`fieldTypes`/`dataTypes` objects). Extract to one shared mapper.
- [ ] No test coverage for `form-service` transactions (create/duplicate/delete/save).

## Completed

- [x] Foundation: Next.js 16 + TypeScript strict + Tailwind 4 + Prisma 7 project setup.
- [x] PostgreSQL 16 via docker-compose, healthchecked, migration applied, up to date.
- [x] Prisma 7 driver-adapter client setup with generated client in `src/generated/prisma`.
- [x] Auth.js v5 credentials auth: register, login, logout, JWT session, `requireUser()` gate.
- [x] Authenticated app shell with navigation and sign-out.
- [x] Dashboard with stat tiles and recent forms.
- [x] Form management: create (unique slug + version 1 + default settings + audit), list, rename,
      duplicate, delete with confirm, response counters.
- [x] Canonical form schema with Zod (`schema.ts`) including settings, theme, sections and 18 field types.
- [x] Field id rules: `fieldIdSchema`, `deriveFieldId`, `collectFieldIds`, duplicate-id rejection.
- [x] Value model: coercion, `isEmptyValue`, `initialFieldValues`, `normalizeFormValues` (§62).
- [x] Layout resolution `buildFormBlocks` for inline dividers and declared sections.
- [x] Conditional visibility and conditional required (§20, §21).
- [x] Shared validation engine with visibility pruning (§19).
- [x] Presentation formatting: currency (IDR/USD/EUR), percentage, number, dates, option labels (§35).
- [x] Single `FormRenderer` with `preview | public | edit-response` modes (§18).
- [x] `FieldInput` covering all 18 field types, with group fieldsets for radio/checkbox/rating/scale.
- [x] Preview page with desktop/tablet/mobile widths, reset, answered counter (§58).
- [x] Builder: add field by type, edit properties, move, delete, save schema (§13, §14).
- [x] Immutable form versioning on every save with audit rows (§50, §60).
- [x] `FormSettings` persistence from the schema (§40).
- [x] `INFO` banner tone for the preview notice.
- [x] Seed data: demo user `demo@example.com` + `Pricing Calculator` form with two sections,
      13 fields, chained formulas and conditional logic (idempotent).
- [x] Fixed `/forms/new` 500: removed the non-async export from the `"use server"` module
      (`src/server/actions/form-actions.ts`); verified the create path end to end.
- [x] `allowedDevOrigins` for LAN dev access.
- [x] Test suite: 3 files, 49 tests, all passing; `npm run verify` (typecheck, lint, test, build) green.
- [x] Portable AI context: `AGENTS.md` + `AI_CONTEXT/` (7 documents).
- [x] Fixed `.gitignore` so `.env.example` is committed (`!.env.example`) while `.env` stays ignored.
- [x] Git initialised on branch `main` with remote `origin` → `github.com/arifmarif/Form-Project.git`;
      first commit `7fd14e7` (151 files) pushed and verified with `git ls-remote`. `.claude/` and
      `.windsurf/` intentionally left untracked.
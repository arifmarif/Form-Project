# Changelog

> Newest first. Only changes actually made to this repository are recorded. For earlier milestones the
> entries reflect what exists in the source code today, not a replayed session log.

## 2026-10-02

### Added

- `AI_CONTEXT/` portable context for AI coding agents: `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`,
  `CURRENT_STATE.md`, `DECISIONS.md`, `TODO.md`, `CHANGELOG.md`, `HANDOFF.md`.
- Root `AGENTS.md` extended with project rules (the `next dev`-generated Next.js agent block is
  preserved at the top of the file).
- `next.config.ts`: `allowedDevOrigins: ["192.168.10.11"]` so the dev server works when the app is
  opened from another machine on the LAN.

### Changed

- `src/server/actions/form-actions.ts`: removed the `export const formIdleState` value export.
- `src/components/dashboard/create-form-form.tsx`: idle state passed inline as
  `{ status: "idle" }` instead of importing a constant from the server action module.

### Fixed

- `/forms/new` returned a blank page / HTTP 500 and `POST /forms/new` failed with 500. Root cause:
  `src/server/actions/form-actions.ts` exported a non-function value from a `"use server"` module,
  which Next.js rejects with
  `Error: A "use server" file can only export async functions, found object.`
  Confirmed from `.next/dev/logs/next-development.log`, fixed by removing the export, then verified
  by calling `createFormAction` over HTTP with an authenticated session: the form row was created and
  the action returned `NEXT_REDIRECT;push;/forms/<id>`.

### Removed

- Temporary investigation artifacts: `src/app/api/debug-create/route.ts`, `check-forms.ts`,
  `cleanup-repro.ts`, a debug `console.log` in `createFormAction`, six PowerShell reproduction scripts
  in the temp directory, and three throwaway database rows (`Repro*`, `Debug Action*`). The database
  again contains only the seeded `Pricing Calculator` form.

### Technical Notes

- Constraint discovered and now recorded in `DECISIONS.md`: a `"use server"` module may only export
  `async` functions. Type-only exports are fine; shared runtime constants must live outside the
  actions module.
- Emulating a `useActionState` submit with `curl`/`Invoke-WebRequest` is unreliable: the page HTML
  contains several `$ACTION_*` hidden fields and the header sign-out form's `$ACTION_ID_` appears
  first, so a naive regex grabs the wrong action (posting it silently signs the user out). Verify
  Server Actions through the browser or a temporary route handler instead.
- `npm run verify` green after the fix: typecheck, lint, 3 test files / 49 tests, production build
  (12 routes). `npx prisma migrate status` → up to date.

### Important Decisions

- Recorded all previously undocumented project decisions in `AI_CONTEXT/DECISIONS.md` (Server Actions
  over REST, Auth.js v5 JWT sessions, ownership-based authorization, layout auth gate instead of
  middleware, dual JSON + relational schema storage, append-only versioning, shared validation
  engine, no `eval`, server-authoritative calculation, Prisma 7 driver adapter, Docker Postgres,
  LAN dev origin).
- Graphify is not installed in this environment; dependency analysis was done by enumerating imports
  directly and is labelled as such in `ARCHITECTURE.md`. No Graphify output was fabricated.

## 2026-10-01 (Milestone 4 work)

### Added

- `src/lib/form-schema/values.ts` — value coercion model (`coerceFieldValue`, `isEmptyValue`,
  `initialFieldValues`, `normalizeFormValues`).
- `src/lib/form-schema/visibility.ts` — conditional visibility and conditional required rules.
- `src/lib/form-schema/layout.ts` — `buildFormBlocks`, resolving inline `section` dividers and
  declared `schema.sections` with `sectionId` references.
- `src/lib/form-schema/format.ts` — currency (IDR/USD/EUR), percentage, number and date formatting;
  `formatFieldValue` for summaries.
- `src/lib/form-schema/parse.ts` — `safeParseFormSchema` / `parseFormSchema` for stored JSON schemas.
- `src/lib/validation/validate.ts` + `index.ts` — shared validation engine (`validateFieldValue`,
  `validateFormValues`, `pruneInvisibleValues`, `schemaFieldOrder`).
- `src/components/form-renderer/form-renderer.tsx` — the single renderer with
  `preview | public | edit-response` modes.
- `src/components/form-renderer/field-input.tsx` — input rendering for all 18 field types.
- `src/components/form-renderer/form-preview.tsx` — device width switcher (desktop/tablet/mobile),
  reset and answered counter.
- `src/app/(app)/forms/[formId]/preview/page.tsx` — preview page.
- `FormBanner` gained an `info` tone.
- `FormField.sectionId` in the Zod schema, with cross-field validation that a field may only point at
  a declared section.
- Test files `src/tests/form-values.test.ts` and `src/tests/validation.test.ts`; suite grew to
  3 files / 49 tests.

### Changed

- `src/components/form-builder/field-editor.tsx`: preserves the stored `sections` array when saving
  (previously the candidate schema was built with an empty `sections` array, which dropped declared
  sections on every save).
- `prisma/seed.ts`: seed fields now carry `sectionId` and the seed wires the
  `sectionId -> row id` mapping, matching the declared-section schema.
- `src/components/form-builder/field-editor.tsx`: validation errors are surfaced from the shared
  schema parser before calling the save action.

### Technical Notes

- Preview banner text claims "validation, conditional logic and calculations run". Validation and
  conditional logic do run; calculations do not exist yet. Tracked as an open issue in
  `CURRENT_STATE.md`.

## Earlier milestones (Milestones 1–3 foundations)

### Added

- Next.js 16 App Router project, Tailwind 4, strict TypeScript, `@/*` alias, Vitest, ESLint.
- `docker-compose.yml` with `postgres:16-alpine` (`formplatform-postgres`, healthcheck, named volume).
- Full Prisma schema: `User`, `Account`, `Session`, `VerificationToken`, `PasswordResetToken`,
  `Form`, `FormVersion`, `Section`, `Field`, `FieldOption`, `Formula`, `FormSettings`, `Response`,
  `ResponseAnswer`, `CalculationResult`, `AuditLog`; enums `Role`, `FormStatus`, `FieldType`,
  `FieldDataType`, `ResponseStatus`; single initial migration.
- Auth.js v5 credentials authentication with JWT sessions, register/login/logout, `requireUser()`
  gate on the `(app)` route group.
- Dashboard, form list, form detail (builder + settings), create form.
- Canonical form schema (`src/lib/form-schema/schema.ts`), field type metadata, slug/field-id helpers.
- `form-service.ts` with create/list/get/update/duplicate/delete/stats, transactions, unique slugs
  and audit log writes.
- Server actions for auth and form CRUD.
- `FieldEditor` with add/edit/move/delete and schema saving.
- `prisma/seed.ts`: demo user `demo@example.com` + the `Pricing Calculator` form with two
  sections, conditional logic and four chained formulas.
- `src/tests/form-schema.test.ts`.

### Technical Notes

- Prisma 7 driver adapter (`@prisma/adapter-pg`) with the client generated to `src/generated/prisma`
  (gitignored).
- Ownership, not roles, gates form access; `Role.ADMIN` is unused.
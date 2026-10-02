# Current State

> Snapshot: 2026-10-02. All statements below were verified against source code, the running dev
> server, the database and `npm run verify` in this session.

## Current Development Status

Working through PRD §80 milestones:

| Milestone | PRD scope | Status |
|---|---|---|
| 1 — Foundation | setup, DB, Prisma, auth, basic UI | Done |
| 2 — Form Management | dashboard, create, edit, delete, duplicate | Done |
| 3 — Builder | field types, drag/drop, properties, sections, autosave | Partially done: field types, properties, add/edit/move/delete/save are implemented. **No drag & drop, no autosave, no section editing UI** |
| 4 — Renderer | schema, renderer, preview, public form, responsive | Partially done: schema, renderer, preview, responsive widths are implemented. **No public form route** |
| 5 — Calculation Engine | lexer, parser, AST, evaluator, functions, dependency graph, circular deps | Not started |
| 6 — Dynamic Form | conditional visibility, conditional required, realtime calculation | Partially done: visibility + conditional required are implemented in the shared lib and renderer. **No realtime calculation** |
| 7 — Responses | submission, list, detail, edit, CSV | Not started (placeholder page only) |
| 8 — Hardening | unit/integration/E2E tests, security audit, perf, prod build | Partially done: unit tests + prod build pass; no integration/E2E tests, no security audit |

Environment state: PostgreSQL container `formplatform-postgres` up and healthy, migrations up to date,
`next dev` running on port 3000 (node PID 20008, started 2026-10-02 00:52 after the `next.config.ts`
change forced a restart), database contains the
seeded user and the single seeded form `Pricing Calculator` (`DRAFT`). All temporary debug files
created during the last investigation were deleted.

## Last Completed Work

Fixed the `/forms/new` crash and verified the create-form write path end to end.

- **Root cause**: `src/server/actions/form-actions.ts` exported a non-function value from a
  `"use server"` module (`export const formIdleState: FormActionState = { status: "idle" }`).
  Next.js rejects the module at request time:
  `Error: A "use server" file can only export async functions, found object.`
  The failure surfaced on both `GET /forms/new` (blank page / 500) and `POST /forms/new` (500),
  because `create-form-form.tsx` imports the action module.
  The export was removed; the idle state literal now lives inline in `create-form-form.tsx`.
- **Added** `allowedDevOrigins: ["192.168.10.11"]` to `next.config.ts` so the dev server serves the
  app when opened from another machine on the LAN. Next restarted itself when the config changed.
- **Verification**: with an authenticated session, `createFormAction` was exercised through a real
  HTTP request (temporary route handler, since removed) and returned
  `NEXT_REDIRECT;push;/forms/<id>` with the row created in PostgreSQL.
  `npm run verify` is green: typecheck, lint, 49 tests, production build.
- **Cleanup**: temporary `check-forms.ts`, `cleanup-repro.ts`, `src/app/api/debug-create/route.ts`,
  a debug `console.log`, six PowerShell repro scripts and three test rows (`Repro*`, `Debug Action*`)
  were removed. Database now holds only `Pricing Calculator`.

## Currently In Progress

Nothing. No task is half-finished. The documentation pass (`AGENTS.md` + `AI_CONTEXT/`, 7 documents)
was finished and verified on 2026-10-02 and touches no application source.

## Current Problems

### Issue 1 — PRD §17 dual schema storage is only half-populated

#### Symptoms

Rows saved through `saveFormSchema` have `fields.sectionId = null`, and duplicated forms have no
`Section` / `Field` / `FieldOption` / `Formula` rows at all.

#### Suspected Cause

Design intent (PRD §51) is to store the schema both as JSON and as relational rows. The write path
creates both, but:

- `form-service.saveFormSchema` creates `Section` rows first and then creates fields **without**
  passing `sectionId`, so the FK is never populated.
- `form-service.duplicateForm` copies only `FormVersion.schema` (JSON) into the new version.

#### Investigation Already Done

Read `src/server/services/form-service.ts` (`saveFormSchema`, `duplicateForm`) and
`prisma/seed.ts` (which *does* wire `sectionId` — so seeded data and saved data differ). Read path
verified: `getFormForOwner` selects only `versions[0].schema`, so no user-visible symptom exists yet.

#### Graphify Findings

Not applicable — Graphify unavailable in this environment.

#### Current Status

Latent, not user-visible. Nothing reads the relational field rows today.

#### Recommended Next Investigation

Decide with the PRD in hand whether relational rows are meant to be the query surface for responses
and exports. If yes, fix `saveFormSchema` to map `sectionId` through a `sectionId -> row id` map (as
`prisma/seed.ts` already does) and make `duplicateForm` rebuild the rows. If no, stop writing them and
document the JSON column as the single source of truth.

### Issue 2 — `FormRenderer` advertises calculations that do not exist

#### Symptoms

The preview banner reads "Preview mode: validation, conditional logic and calculations run, but
nothing is stored." No calculation code exists in the repository.

#### Suspected Cause

The banner was written against the PRD end state (Milestone 5) while Milestone 4 shipped first.

#### Investigation Already Done

`grep` over `src/` finds no evaluator, lexer, parser, formula execution or calculation module.
`Field.type === "calculation"` fields render through `FieldInput` as a disabled numeric input;
`validateFieldValue` returns `null` for them ("the engine owns it").

#### Current Status

Copy is inaccurate. Calculation fields display nothing meaningful in preview.

#### Recommended Next Investigation

Either soften the banner text, or build the engine (Milestone 5) and leave the text as is. Prefer
building the engine, but do not let the copy claim working behaviour in the meantime.

### Issue 3 — Resolved: Git initialised on 2026-10-02

The repository did not exist as a Git repo until 2026-10-02, when the user asked for it explicitly.

- `git init -b main`, remote `origin` → `github.com/arifmarif/Form-Project.git`
- First commit `7fd14e7` "Initial commit: Form Platform foundation (Next.js 16 + Prisma 7)",
  151 files, pushed to `origin/main` (verified with `git ls-remote`)
- Commit identity is configured **locally** for this repo only: `arif <marif.rizky19@gmail.com>`;
  the global Git config was not modified
- `.gitignore` fixed: the `.env*` rule was also excluding `.env.example`, so the template is now
  committed via `!.env.example`. `.env` itself stays untracked
- Deliberately **not** committed: `.claude/` and `.windsurf/` (67 duplicated vendored Prisma skill
  files each, installed per AI tool). `.agents/` and `skills-lock.json` **are** committed. Add the
  others with `git add .claude .windsurf` only if they are wanted in the repo

### Issue 4 — README is still the create-next-app default

`README.md` documents only `npm run dev` and Vercel deployment. It does not mention Docker/Postgres,
migrations, seed credentials, the LAN host or `npm run verify`.

#### Recommended Next Investigation

Rewrite it from `PROJECT_CONTEXT.md` once the next milestone lands. Not urgent; `AI_CONTEXT/` covers
agent needs.

## Working Features

Verified by code reading plus a live end-to-end write on 2026-10-02:

- Register → creates user, signs in, redirects to `/dashboard`
- Login / logout (JWT cookie `authjs.session-token`)
- `(app)` route group gate: unauthenticated visitors are redirected to `/login`
- Dashboard stats (total / published / draft / closed forms, summed `responseCount`) + 5 recent forms
- Create form: unique slug generation, `FormVersion` v1, default `FormSettings`, `AuditLog` row,
  redirect to `/forms/[formId]`
- Rename / describe a form (`updateFormMetadataAction` + `FORM_EDITED` audit row)
- Delete a form with inline confirm (cascade deletes versions, sections, fields, options, formulas,
  settings, responses, logs)
- Duplicate a form (JSON schema copy + settings copy + `FORM_DUPLICATED` audit row)
- Builder: add any of the 18 field types, edit label / field id / description / required / options /
  formula, move up-down, delete, save (validates with `formSchemaSchema`, creates a new version)
- Preview at desktop / tablet / mobile widths, reset answers, answered counter
- Renderer behaviour: conditional visibility and conditional required, per-type inputs
  (text, textarea, email, phone, date, time, datetime, dropdown, radio, checkbox, rating, linear
  scale, currency, percentage, hidden, section divider, disabled calculation), live validation,
  focus-first-invalid on submit, theme colour/font/radius
- Shared validation engine with unit coverage, including "hidden fields are skipped and their values
  stripped" and "calculation fields are ignored"
- Audit log written for create / edit / schema save / duplicate / delete

## Broken Features

None known. The `/forms/new` 500 from the previous session is fixed and verified.

Known gaps are missing features, not defects: no public form page, no submission, no publish/unpublish,
no response detail/edit/export, no calculation engine, no builder drag & drop / autosave / section
editing, no admin role usage, no integration or E2E tests.

## Current Blockers

No known blockers.

## Exact Next Step

Implement **Milestone 5 — Calculation Engine** as a pure, isomorphic module and wire it into the
renderer, because everything else in Milestone 4/6 (public form, submission, realtime results) depends
on it and `FormRenderer` already advertises it (Issue 2).

Concretely, in this order:

1. Create `src/lib/calculation/` with:
   - `tokenizer.ts` — lexer for numbers, identifiers (field ids), operators, parentheses, commas,
     strings, per PRD §23
   - `parser.ts` — recursive-descent parser producing a typed AST; reject anything not in PRD §23/§24
     (`eval`/`new Function` are forbidden by PRD §75)
   - `functions.ts` — PRD §24 built-ins (`SUM`, `AVG`, `MIN`, `MAX`, `ROUND`, `CEIL`, `FLOOR`, `ABS`, …)
   - `graph.ts` — field → formula dependency graph plus circular-dependency detection (PRD §31, §32)
   - `evaluate.ts` — pure `evaluateFormula(expression, values)` and `calculateSchema(schema, values)`
     returning computed values keyed by calculation field id
   - `index.ts` barrel, mirroring the `src/lib/form-schema` layout
2. Unit tests in `src/tests/calculation.test.ts` following the existing style (Vitest, `describe`/`it`,
   no new dependency). Cover every operator in PRD §23, the built-ins in §24, a chained formula case
   (`subtotal -> discount_amount -> tax_amount -> grand_total`, exactly the seeded schema), circular
   reference rejection, and unknown-field rejection.
3. Call `calculateSchema` from `FormRenderer` after each value change (recompute only calculation
   fields, never let the client write them — PRD §79), and render the result with
   `formatFieldValue` from `src/lib/form-schema/format.ts`.
4. Re-run `npm run verify` and update `AI_CONTEXT/` (this file, `TODO.md`, `CHANGELOG.md`, `HANDOFF.md`;
   `ARCHITECTURE.md` because a new shared library appears).

Do **not** start the public form route or the submission action before the engine exists — the PRD
requires server-side recalculation on submit as the source of truth, and writing submission first
would create a path that stores client-supplied calculation values.
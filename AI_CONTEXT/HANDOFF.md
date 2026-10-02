# AI HANDOFF

Written for an AI coding agent that has never seen this conversation. Read the files below, then
inspect the source before changing anything.

## READ THESE FILES FIRST

1. `AGENTS.md`
2. `AI_CONTEXT/PROJECT_CONTEXT.md`
3. `AI_CONTEXT/ARCHITECTURE.md`
4. `AI_CONTEXT/CURRENT_STATE.md`
5. `AI_CONTEXT/DECISIONS.md`
6. `AI_CONTEXT/TODO.md`
7. `AI_CONTEXT/CHANGELOG.md` (this file's history)
8. `form-builder-calculation-platform-prd.md` — scope of record (§80 milestones, §23/§24 operators
   and built-ins, §28 formula security, §42 submission transaction, §78/§79 architecture and
   server-authoritative calculation)

## PROJECT

"Form Platform" (`formapp`) — a Next.js 16 / React 19 / Prisma 7 / PostgreSQL 16 application where a
form owner builds forms from a canonical JSON schema and collects responses, with a native formula
engine producing server-authoritative calculated values. PRD: `form-builder-calculation-platform-prd.md`
(Indonesian, 2286 lines). No payment, no email, no external services, not deployed.

## CURRENT STATE

Milestones 1–2 implemented; Milestone 3 partial (field add/edit/move/delete/save done — **no drag &
drop, autosave or section editing UI**); Milestone 4 partial (renderer, preview, responsive done —
**public form route missing**); Milestone 5 not started; Milestone 6 partial (conditional
visibility/required done — **realtime calculation missing**); Milestone 7 not started (placeholder
page only); Milestone 8 partial (unit tests + production build pass — **no integration/E2E tests,
no security or performance pass**). Environment: Postgres container healthy, one migration applied and
up to date, `next dev` running on port 3000 (node PID 20008), database holds the seeded user and the
`Pricing Calculator` form only. `npm run verify` is green (typecheck, lint, 3 test files / 49 tests,
production build with 12 routes), re-confirmed 2026-10-02 after this documentation pass.

## LAST COMPLETED

Fixed the `/forms/new` 500 caused by a non-async export in the `"use server"` module
`src/server/actions/form-actions.ts` (removed `export const formIdleState`; the idle state is now
inline in `create-form-form.tsx`). Verified by calling `createFormAction` over HTTP with a real
session — row created, response `NEXT_REDIRECT;push;/forms/<id>`. Added
`allowedDevOrigins: ["192.168.10.11"]` for LAN dev access. All debug artifacts and test rows removed.

## CURRENTLY WORKING ON

Nothing. No task is half-finished. The documentation pass (`AGENTS.md` + `AI_CONTEXT/`) is complete
and verified; no application source file is modified.

## KNOWN ISSUES

1. **Dual schema storage is half-written** — `saveFormSchema` never sets `Field.sectionId`
   (fields are created without it) and `duplicateForm` copies only `FormVersion.schema`, so duplicated
   forms have no `Section`/`Field`/`FieldOption`/`Formula` rows. Harmless today because reads use the
   JSON column only. See `CURRENT_STATE.md` → Issue 1.
2. **Preview banner overpromises** — `form-renderer.tsx:178` says calculations run; no calculation code
   exists. See `CURRENT_STATE.md` → Issue 2.
3. **No Git repository** — `git status` fails. No history, no rollback. Do not `git init` or commit
   without explicit instruction.
4. **README is the `create-next-app` default** — no setup/seed/Docker/LAN instructions.
5. **Page-level Prisma access** — `src/app/(app)/responses/page.tsx` queries `@/lib/db` directly,
   bypassing the service layer.

## IMPORTANT DECISIONS

- Server Actions (not REST) for all domain writes; a `"use server"` module may export **only async
  functions** — types are safe, runtime constants are not.
- Server layout gate (`src/app/(app)/layout.tsx` → `requireUser()`) instead of middleware.
- Authorization is ownership-based (`ownerId` filters in `form-service`); `Role.ADMIN` is unused.
- Form schema lives in Zod (`src/lib/form-schema/schema.ts`), stored as JSON in `FormVersion.schema`
  **and** materialised into relational rows; JSON is the current read source of truth.
- Schema saves are append-only `FormVersion` rows; `Response.formVersionId` is `onDelete: Restrict`.
- One shared validation engine for client and server; `normalizeFormValues` is the payload boundary.
- One shared renderer — no duplicate form UI (PRD §75).
- No `eval` / `new Function`; the engine must be lexer → parser → AST → evaluator with a dependency graph.
- Calculations are recomputed server-side on submit; client values are UX only.
- Prisma 7 with `@prisma/adapter-pg`; client generated to `src/generated/prisma` (gitignored,
  regenerate with `npm run db:generate`).

## DO NOT CHANGE

- Do not run `git init`, `git commit`, `git reset` or `git checkout` without explicit user instruction.
- Do not edit `src/generated/prisma/**`.
- Do not add a second form renderer or a second validation engine.
- Do not mutate or delete a `FormVersion` that a response references.
- Do not trust client-supplied calculation values; never persist them.
- Do not commit `.env` or any real secret. `.env.example` documents the three required variables.
- Do not change the `"use server"` export rule, the ownership filters in `form-service`, or the
  `ownerId` parameter of service functions without an explicit instruction.
- Do not replace the single `FormRenderer` component with per-surface form implementations.
- Do not introduce dependencies that are not already in `package.json` without asking.

## GRAPHIFY NOTES

Graphify is **not installed** in this environment. Checks performed on 2026-10-02: `Get-Command graphify`,
`npm ls -g`, `npx graphify --version` (fails: "could not determine executable to run"), a recursive
filename search in the project, and `pip` (not installed). No MCP graphify server is configured.

Per the instructions, no Graphify output was fabricated. The dependency analysis in
`AI_CONTEXT/ARCHITECTURE.md` was produced by enumerating every `import` statement under `src/` and
cross-checking `prisma/schema.prisma`, and every relationship stated there was verified against the
files themselves. If Graphify becomes available, use it to re-verify the import graph and the impact
areas, then update `ARCHITECTURE.md` only where the two disagree with the source.

Key relationships that matter most when changing things (all verified by reading the files):

- `src/lib/form-schema/schema.ts` is the contract consumed by the builder, the renderer, the
  validation engine, `form-service.saveFormSchema` and the seed.
- `FormRenderer` → `layout.ts` + `visibility.ts` + `values.ts` + `@/lib/validation` + `field-input.tsx`.
- `createFormAction` / `saveSchemaAction` → `requireUser()` → `form-service` → `prisma.$transaction`.
- `getFormForOwner` is the single read path for a form + its latest schema, used by three pages.
- Pages reach data only through `src/server/services/*` (one deliberate exception: `/responses`).

## NEXT ACTION

Implement the calculation engine as a pure isomorphic module, then wire it into `FormRenderer`.
Detailed step-by-step spec: `AI_CONTEXT/CURRENT_STATE.md` → **Exact Next Step**, with the PRD
references in `AI_CONTEXT/TODO.md` → Critical. In short:

1. `src/lib/calculation/`: `tokenizer.ts`, `parser.ts` (recursive descent → AST), `functions.ts`
   (PRD §24), `graph.ts` (dependency graph + circular detection, §31/§32), `evaluate.ts`, `index.ts`.
2. `src/tests/calculation.test.ts` covering §23 operators, §24 built-ins, the seeded
   `subtotal → discount_amount → tax_amount → grand_total` chain, circular references, unknown fields.
3. Call `calculateSchema` from `FormRenderer` on each change; render with `formatFieldValue`.
4. `npm run verify`, then update `CURRENT_STATE.md`, `TODO.md`, `CHANGELOG.md`, `HANDOFF.md`, and
   `ARCHITECTURE.md` (a new shared library changes the dependency graph).

Do not build the submission action before the engine exists.

## VERIFICATION

After any change:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build` (when relevant — e.g. new routes, new server exports, config changes)
5. `npm run verify` runs 1–4 in order and is the single command to run before reporting done.
6. Verify the affected functionality in the app: dev server on `http://localhost:3000`, signing in with
   the seeded demo account from `prisma/seed.ts`. The app is also reachable at
   `http://192.168.10.11:3000` (`allowedDevOrigins`).
7. If a schema changed: `npm run db:generate`, then `npx prisma migrate status`, and confirm
   `npm run verify` still passes.
8. Check the dependency impact of what you touched against the import maps in `ARCHITECTURE.md`.
9. Report exactly what changed, including anything you deliberately did not do.
10. After finishing a task, update `AI_CONTEXT/` (see `AGENTS.md` → After completing a task). Never
    leave `CURRENTLY WORKING ON` or `NEXT ACTION` stale.

Useful debugging locations:

- Next.js dev logs: `.next/dev/logs/next-development.log` (this is where the `"use server"` export
  error surfaced).
- Do not try to emulate a `useActionState` POST with `curl`/`Invoke-WebRequest`: the page contains
  several `$ACTION_*` fields and the header sign-out action appears first, so a naive pick signs the
  user out instead of calling the intended action. Use the browser, or a temporary route handler that
  imports the action and returns the caught `NEXT_REDIRECT` digest.
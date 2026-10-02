<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Permanent instructions for every AI coding agent working in this repository.
Project rules start here; the Next.js block above is machine-generated and must stay in the file.

## Project

Form Platform (`formapp`): a Next.js 16 App Router application where an authenticated form owner
builds forms from a canonical JSON schema and collects responses, with a native formula engine that
produces server-authoritative calculated values. Stack: Next.js 16.3.7, React 19.2.8, TypeScript 5
(strict), Tailwind 4, Prisma 7 with the `@prisma/adapter-pg` driver adapter, PostgreSQL 16 (Docker
Compose), Auth.js v5 (credentials + JWT), Zod 4, Vitest 5. No payment, no email, no external
services, not deployed.

Scope of record: `form-builder-calculation-platform-prd.md` (PRD). Milestones in PRD §80; the engine
spec is PRD §23, §24, §28, §31, §32, §42, §79.

Layering: route/page → client component → server action → service → Prisma → PostgreSQL, with
`src/lib/**` (isomorphic, no Prisma) shared by client and server.

## Before Making Changes

AI agent WAJIB:

1. Read `AGENTS.md`.
2. Read `AI_CONTEXT/PROJECT_CONTEXT.md`.
3. Read `AI_CONTEXT/ARCHITECTURE.md`.
4. Read `AI_CONTEXT/CURRENT_STATE.md`.
5. Read `AI_CONTEXT/DECISIONS.md`.
6. Read `AI_CONTEXT/TODO.md`.
7. Read `AI_CONTEXT/HANDOFF.md`.
8. Inspect the relevant source files (`src/lib/form-schema/schema.ts` is the contract; read it before
   touching schema, builder, renderer or validation).
9. Check Git status (`git status`). Note: this repository is currently **not** initialised as a Git
   repo — that is expected, do not "fix" it silently.
10. Use Graphify when available and relevant.
11. Check `.next/dev/logs/next-development.log` if something renders or posts unexpectedly.

## Graphify Rules

For any task touching architecture, dependencies, database, API, component relationships or service
relationships:

1. Use Graphify to understand the relevant dependencies.
2. Identify the impact area before editing.
3. Inspect the relationships between the affected files/modules.
4. Verify Graphify output against the real source code.
5. Do not start a large change before understanding the relevant dependencies.

If Graphify is unavailable, fails, or does not support a given analysis:

- fall back to direct source-code inspection (e.g. enumerating imports)
- never invent, guess or fabricate Graphify output
- note the limitation in `AI_CONTEXT/HANDOFF.md` → GRAPHIFY NOTES

Status as of 2026-10-02: Graphify is not installed here (no CLI, no global package, no MCP server),
so the dependency maps in `AI_CONTEXT/ARCHITECTURE.md` were produced by reading imports directly.

## Development Rules

- Preserve the existing architecture unless explicitly instructed otherwise.
- Reuse existing components and utilities (`src/components/ui/*`, `src/lib/*`, `src/server/services/*`).
- Do not introduce unnecessary dependencies; the current dependency set is intentional.
- Do not rewrite working functionality without a stated reason.
- Do not change the database schema without understanding existing relationships.
- Do not expose secrets; do not hardcode credentials.
- Do not modify unrelated files; keep changes focused on the requested task.
- TypeScript strict mode stays on; avoid broad `any`.
- Match the existing code style: double quotes, semicolons, 2-space indent, named exports,
  `import type` for type-only imports, early returns.
- Comment only non-obvious intent (the existing code documents the "why" in short doc blocks).

### Hard constraints discovered in this codebase

- A `"use server"` module may export **only async functions**. Exporting a non-function runtime value
  (`export const idleState = {...}`) breaks every route that imports it with
  `Error: A "use server" file can only export async functions, found object.` Type-only exports are
  safe. Shared constants belong in `src/lib/**` or a service module.
- Never use `eval` or `new Function` for formulas (PRD §28, §75). The calculation engine must be a
  hand-written lexer/parser/evaluator.
- Never trust client-supplied calculation values; the server recalculates on submit (PRD §79).
- One renderer only (`src/components/form-renderer/form-renderer.tsx`) — no duplicate form UI (PRD §75).
- One validation engine (`src/lib/validation/validate.ts`) used by client and server.
- Field and section ids are lowercase snake_case (`^[a-z][a-f0-9_]*$` — see `fieldIdSchema`) and are
  formula-addressable; renaming a field id requires updating dependent formulas.

## Database Rules

- Inspect `prisma/schema.prisma` before modifying database code.
- Preserve existing relationships and `onDelete` behaviour (`Response.formVersionId` is `Restrict`
  precisely so historical responses survive).
- Check usages before renaming or deleting a field or column.
- Explain migration impact before any destructive change.
- Regenerate the client after a schema change: `npm run db:generate` (output `src/generated/prisma`,
  which is gitignored). Never edit generated files.
- Every schema save creates a new `FormVersion`; never mutate or delete an existing version.
- Writes that touch several tables belong in a single `prisma.$transaction` and write their
  `AuditLog` row inside it.
- Ownership filters (`ownerId`) are mandatory on every form query and mutation.
- Verify affected queries after schema changes; `npx prisma migrate status` must stay clean.

## Security Rules

Never expose or commit:

- API keys, passwords, tokens, private keys, secrets, credentials

Never commit `.env`. Required variables (documented in `.env.example`):
`DATABASE_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST`.

- Validate all user-controlled input with Zod at the action boundary.
- Normalise submission payloads with `normalizeFormValues` / `validateFormValues` so unknown keys
  cannot be stored (PRD §62).
- Keep authentication and authorization server-side: `requireUser()` plus `ownerId` filters.
- Recompute calculations on the server before persisting results.
- Report security-relevant findings; do not silently weaken a check.

## Testing Rules

After changes:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run test`
4. `npm run build` (when relevant: new routes, new server exports, config changes)
5. Verify the affected functionality in the running app
6. Check dependency impact for significant changes against the import maps in
   `AI_CONTEXT/ARCHITECTURE.md`

`npm run verify` runs 1–4 in order and is the single command to run before reporting done.
New logic (engine, services, parsers) requires new unit tests in `src/tests/*.test.ts` (Vitest,
`describe`/`it`, node environment). Do not introduce a new test runner.

If a command fails, report the exact failure — never describe a failing check as passing.

## After Completing a Task

Every significant task must update `AI_CONTEXT/`. Documentation and source code stay in sync.

### 1. Update `AI_CONTEXT/CURRENT_STATE.md`

Refresh: current development status, last completed work, currently in progress, problems, blockers,
and the exact next step. `CURRENTLY WORKING ON` and `Exact Next Step` must always match reality.

### 2. Update `AI_CONTEXT/TODO.md`

Move finished tasks to `Completed` as `- [x]`. Add tasks only when genuinely discovered from source
code, configuration, the PRD or real investigation — never from assumption.

### 3. Update `AI_CONTEXT/CHANGELOG.md`

Add a `## [YYYY-MM-DD]` section with `### Added / Changed / Fixed / Removed / Technical Notes /
Important Decisions` as applicable. Do not invent historical entries.

### 4. Update `AI_CONTEXT/DECISIONS.md`

Document new technical or business decisions with the required structure. No new decision → no edit.

### 5. Update `AI_CONTEXT/ARCHITECTURE.md`

Mandatory when a change touches architecture, database, API, authentication, payment, email, folder
structure, external services or dependency relationships. No architectural change → no edit.

### 6. Update `AI_CONTEXT/HANDOFF.md`

Keep CURRENT STATE, LAST COMPLETED, CURRENTLY WORKING ON, KNOWN ISSUES, IMPORTANT DECISIONS,
DO NOT CHANGE, GRAPHIFY NOTES and NEXT ACTION accurate.

### 7. Update `AI_CONTEXT/PROJECT_CONTEXT.md`

When the stack, environment variables, roles, features or deployment story change.

### 8. Update Graphify Context

If the task changed dependencies, module/component relationships, API flows or database
relationships, re-run Graphify to verify the new state. If Graphify is unavailable, re-derive the
import graph by inspecting `src/` and update `ARCHITECTURE.md` accordingly.

### 9. Verify Context

Before declaring the task done:

1. Review the source you changed.
2. Ensure the documentation matches the source.
3. Remove obsolete statements.
4. Ensure no secrets appear anywhere.
5. Confirm TODO and HANDOFF are accurate.
6. Confirm every file path referenced in the documentation exists.

### 10. Git

After source and `AI_CONTEXT/` are updated, run `git status` and show the changes.

Do not run:

```
git reset
git checkout
```

or delete the user's changes without explicit permission.

If the user asks for a commit, it must include the relevant source code **and** the relevant
`AI_CONTEXT/` files.

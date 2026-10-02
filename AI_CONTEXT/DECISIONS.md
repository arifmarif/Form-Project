# Decisions

> Technical and business-logic decisions actually taken in this project, with the reason recorded at
> the time. Only decisions that exist in the code or in the PRD are listed — nothing speculative.

## Decision: Next.js 16 App Router with React Server Components

### Decision

Next.js 16.3.7 App Router, no `pages/` directory. Pages are async server components; interactive
parts are `"use client"` components. `LayoutProps`/`PageProps` global types (Next 16) are used
instead of hand-written prop types.

### Reason

PRD §67/§68 prescribe the Next.js App Router architecture. It also gives progressive enhancement
through Server Actions for free, which the PRD's "no mockups without a backend" rule benefits from.

### Alternatives Considered

Pages Router (rejected: not what the PRD specifies), a separate SPA + API backend (rejected: more
infrastructure for the same feature set).

### Current Implementation

`src/app/**` only. `npm run build` compiles with Turbopack.

### Important

Keep. Do not introduce `pages/` or a second rendering stack.

## Decision: Server Actions instead of a REST API for domain writes

### Decision

All domain mutations go through `"use server"` modules in `src/server/actions`. The only route
handler is Auth.js (`src/app/api/auth/[...nextauth]/route.ts`).

### Reason

PRD §54/§55 ask for an API layer with server-side validation and security; Server Actions satisfy
that with less boilerplate and keep validation next to the UI that triggers it. Chosen during the
foundation work.

### Alternatives Considered

REST/JSON route handlers (rejected: more code, no benefit at this scale), tRPC (rejected: extra
dependency, PRD stack does not include it).

### Current Implementation

`src/server/actions/auth-actions.ts` (`registerAction`, `loginAction`, `logoutAction`),
`src/server/actions/form-actions.ts` (`createFormAction`, `updateFormMetadataAction`,
`saveSchemaAction`, `duplicateFormAction`, `deleteFormAction`).

### Important

Keep — with one hard constraint discovered on 2026-10-02: **a `"use server"` module may only export
`async` functions.** Exporting a non-function runtime value breaks every route that imports the
module (`Error: A "use server" file can only export async functions, found object.`). Shared
constants and types used by actions must live outside the actions module — the idle action state is
inlined in the client components, `IDLE_STATE`/`ActionState` live in `user-service.ts`, and
`FormActionState` is a type-only export in `form-actions.ts` (types are erased and safe).

## Decision: Auth.js v5 Credentials provider with JWT sessions

### Decision

Single Credentials provider, `session.strategy: "jwt"`, `token.sub = user.id` in the `jwt` callback,
`session.user.id` in the `session` callback. Custom sign-in page at `/login`.

### Reason

MVP needs email + password only (PRD §7, §71). JWT sessions avoid storing sessions in Postgres and
keep `auth()` cheap inside Server Actions. No adapter means no OAuth/account plumbing to maintain.

### Alternatives Considered

Prisma adapter with database sessions (rejected: not needed yet, extra writes),
NextAuth v4 (rejected: v5 is the current beta line in the dependency set and is what `next-auth@5`
provides).

### Current Implementation

`src/lib/auth.ts`, re-exported by `src/auth.ts`; type augmentation in `src/types/next-auth.d.ts`;
cookie `authjs.session-token` (JWE, HttpOnly, SameSite=Lax).

### Important

Keep. If OAuth or database sessions are added later, add them additively — do not replace credentials.

## Decision: Ownership-based authorization, no role checks yet

### Decision

Authorization is enforced by filtering on `ownerId` inside every `form-service` query/mutation, and
by `requireUser()` in the `(app)` layout. `User.role` exists in the schema but is never read.

### Reason

PRD §6 defines Form Owner / System Admin / Responder, but the MVP (PRD §71) only needs owner-level
access control. Ownership filters are simpler to audit than permission tables and cannot forget a
check the way a role lookup can.

### Alternatives Considered

Permission matrix / RBAC tables (rejected for MVP: PRD §5 lists multi-tenant enterprise permissions as
a non-goal), middleware-based auth (not used: no `middleware.ts` exists; the route-group layout gate
covers the authenticated surface).

### Current Implementation

`getFormForOwner(ownerId, formId)` throws `FormActionError` → pages call `notFound()`;
`createForm`/`updateFormMetadata`/`saveFormSchema`/`duplicateForm`/`deleteForm` all take `ownerId`.

### Important

Keep the ownership filters on every new query. Introducing real role checks is a separate, explicit
decision — do not start it implicitly.

## Decision: Server layout gate instead of middleware

### Decision

`src/app/(app)/layout.tsx` calls `requireUser()` once for the whole authenticated group. Pages inside
still call `requireUser()` where they need the user object.

### Reason

There is no `middleware.ts` in the project. A single layout gate covers every current and future route
in the group with one call, and it runs in the React render where `auth()` is already available.

### Alternatives Considered

`middleware.ts` matcher (rejected: duplicates the check, adds a second place to keep in sync),
per-page checks only (rejected: easy to forget on a new page).

### Current Implementation

`src/app/(app)/layout.tsx` + `requireUser()` in each page; `/login` and `/register` redirect to
`/dashboard` when a session exists.

### Important

Keep. Any new authenticated route belongs inside `(app)` so it inherits the gate.

## Decision: One canonical JSON schema, stored twice

### Decision

`src/lib/form-schema/schema.ts` defines the form schema with Zod. It is stored as JSON in
`FormVersion.schema` **and** materialised into `sections`, `fields`, `field_options`, `formulas`
rows, with `Form.theme` and `FormSettings` also persisted.

### Reason

PRD §17 and §51: the JSON column keeps a version immutable and cheap to read for rendering, while the
relational rows are the query surface for responses, exports and reporting at scale.

### Alternatives Considered

Relational only (rejected: PRD §50 requires immutable per-version snapshots, which is painful with
mutable rows), JSON only (rejected: PRD §51 explicitly specifies the relational structure).

### Current Implementation

`formSchemaSchema` (Zod) is validated on save in `saveSchemaAction` and again in `FieldEditor`;
`saveFormSchema` writes both representations inside one `prisma.$transaction`. Reads currently use
only the JSON. Two gaps are tracked in `CURRENT_STATE.md` → Issue 1: `Field.sectionId` is never
populated on save, and `duplicateForm` copies only the JSON.

### Important

The JSON column is the current source of truth for rendering. Do not start reading relational field
rows until Issue 1 is resolved, or reads and writes will disagree.

## Decision: Schema saves are append-only versions

### Decision

Every builder save creates a new `FormVersion` row with the next integer version. Nothing mutates an
existing version. `Response.formVersionId` is `onDelete: Restrict`.

### Reason

PRD §50 (form versioning) and §52 (historical responses must survive edits).

### Alternatives Considered

Mutating the latest version (rejected: breaks response history), snapshotting only on publish
(rejected: PRD wants every save recorded).

### Current Implementation

`saveFormSchema` computes `nextVersion` from the latest version and inserts sections, fields,
options, formulas, theme/settings upsert and an audit row in one transaction.

### Important

Keep. Never update or delete a version that a response references.

## Decision: Unique slugs with a bounded collision probe

### Decision

`uniqueSlug(base)` tries `base`, then `base-2`, `base-3`, … up to 1000 attempts, falling back to a
timestamp suffix. Slug source is `slugify(name)` (lowercase, diacritics stripped, non-alphanumerics
to `-`, 60 chars max).

### Reason

`forms.slug` is unique and the slug is the public URL. A simple deterministic loop is enough for this
product; the timestamp fallback makes a total failure effectively impossible.

### Alternatives Considered

Random suffixes (rejected: ugly URLs), UUID slugs (rejected: PRD implies readable public URLs).

### Current Implementation

`form-service.uniqueSlug`, used by `createForm` and `duplicateForm` (`{slug}-copy`).

### Important

Keep the deterministic order — the same name should always produce the same suffix.

## Decision: Value coercion and payload normalization at the shared boundary

### Decision

`src/lib/form-schema/values.ts` owns the value model: numeric fields are stored as `number`,
checkbox as `string[]`, text as `string`, empty as `null`. `normalizeFormValues` keeps only known
field ids and drops empty values.

### Reason

PRD §62 requires that a crafted payload cannot smuggle unknown keys into a response, and PRD §29 fixes
the data types. Doing it once in a shared module means client and server agree.

### Alternatives Considered

Per-component parsing (rejected: duplicated, drifts), trusting DOM strings (rejected: PRD §75
forbids trusting client validation).

### Current Implementation

`coerceFieldValue`, `isEmptyValue`, `initialFieldValues`, `normalizeFormValues`; consumed by
`FormRenderer` and `validateFormValues`.

### Important

Keep. Any new submission path must run `normalizeFormValues` (or `validateFormValues`, which calls it)
before writing answers.

## Decision: A single shared validation engine

### Decision

`src/lib/validation/validate.ts` implements validation once, isomorphic, used by the renderer today
and intended as the authoritative server check on submission. Order: required → type → constraint →
conditional required.

### Reason

PRD §19 defines one engine; PRD §75 forbids trusting client validation; duplicating rules would let
client and server disagree.

### Alternatives Considered

Separate client/server validators (rejected: guarantees drift), Zod schemas per field type in the
schema JSON (rejected: the JSON schema is authored in the builder UI, so runtime validation must not
depend on executable content).

### Current Implementation

`validateFieldValue`, `validateFormValues`, `pruneInvisibleValues`, `schemaFieldOrder`; 20 unit tests
in `src/tests/validation.test.ts`.

### Important

Keep. Do not add a second validator when the submission action is written.

## Decision: Field ids are lowercase snake_case and formula-addressable

### Decision

`fieldIdSchema` requires `^[a-z][a-z0-9_]*$`, max 64 chars. The builder derives ids from labels with
`deriveFieldId`, guaranteeing uniqueness against field *and* section ids (`collectFieldIds`).
Ids are unique across the whole schema (fields and sections share one namespace).

### Reason

PRD §14 requires stable, formula-usable identifiers (`quantity * price`), and PRD §31 needs a
dependency graph keyed by id.

### Alternatives Considered

Display labels as references (rejected: renaming a label would break formulas), UUID ids
(rejected: unreadable in formulas).

### Current Implementation

Zod validation in `fieldSchema`/`sectionSchema` plus the cross-field `superRefine` that rejects
duplicate ids and unknown `sectionId` references.

### Important

Keep. Any code renaming a field must update `Field.fieldId` and dependent `Formula.expression`.

## Decision: Two section shapes, resolved by `buildFormBlocks`

### Decision

Sections can be inline `section` fields (what the builder creates) or declared `schema.sections`
with fields pointing at them via `sectionId`. Inline dividers take precedence, so builder order is
never second-guessed.

### Reason

PRD §16 defines sections; the builder currently produces dividers while the seed data and PRD §17
schema use declared sections. Supporting both keeps old data renderable without a migration.

### Alternatives Considered

Declared sections only (rejected: forces a builder rewrite first), inline only (rejected: cannot
express the PRD schema shape).

### Current Implementation

`buildFormBlocks(schema) → FormBlock[]` with an implicit leading group; used by the renderer and by
`schemaFieldOrder`.

### Important

Keep the precedence rule. Changing it silently reorders existing forms.

## Decision: Audit log written inside the same transaction as each mutation

### Decision

`createForm`, `updateFormMetadata`, `saveFormSchema`, `duplicateForm`, `deleteForm` each insert an
`AuditLog` row (`FORM_CREATED`, `FORM_EDITED`, `FORM_SCHEMA_SAVED`, `FORM_DUPLICATED`,
`FORM_DELETED`) inside their transaction.

### Reason

PRD §60 requires an audit trail; an audit row that can disagree with the data it describes is worse
than none.

### Alternatives Considered

Async logging (rejected: no queue in the stack, and ordering would be lost), logging only in the
service (chosen — keeps it out of the actions layer).

### Current Implementation

`src/server/services/form-service.ts`.

### Important

Keep. New write operations should follow the same pattern.

## Decision: No `eval` / no formula execution yet

### Decision

`calculation` fields currently store `formula` as a string and render as a disabled input; no code
evaluates them. `validateFieldValue` returns `null` for calculation fields ("the engine owns it").

### Reason

The engine is Milestone 5. PRD §28 (formula security) and §75 forbid `eval`, so the engine must be a
hand-written lexer/parser/evaluator. Building it half-way risks a `new Function` shortcut.

### Alternatives Considered

`eval`/`new Function` (forbidden by PRD), a formula library (rejected: PRD §69 specifies a custom
deterministic module with a dependency graph).

### Current Implementation

`Formula.expression` rows + `Field.formula` in JSON; both written by `saveFormSchema` and the seed.

### Important

The next agent must build the engine without `eval`. See `CURRENT_STATE.md` → Exact Next Step.

## Decision: Server-authoritative calculation (client values are UX only)

### Decision

Recorded as a project constraint from PRD §79: the browser may compute for feedback, but the server
recalculates from the stored `FormVersion` before persisting `CalculationResult`.

### Reason

Otherwise a user can post arbitrary numbers for calculation fields.

### Alternatives Considered

Trusting the client (rejected: PRD §62), server-only calculation (rejected: PRD §33 requires realtime
client feedback for UX).

### Current Implementation

Not implemented yet — there is no submission path. It constrains the order of work: engine →
submission, never submission first.

### Important

When writing the submission action, recalculate server-side inside the same transaction that inserts
`Response`, `ResponseAnswer` and `CalculationResult` (PRD §42), and increment `Form.responseCount`
there.

## Decision: Prisma 7 with a pg driver adapter and generated client outside `node_modules`

### Decision

`@prisma/adapter-pg` + `pg` with the client generated into `src/generated/prisma`, gitignored.
Prisma CLI config in `prisma7.config.ts`; services and the seed import from
`@/generated/prisma/client` or a relative path.

### Reason

Prisma 7 removed the built-in engine and requires a driver adapter. Generating inside `src` keeps the
`@/` alias usable and makes the seed importable without path gymnastics.

### Alternatives Considered

Generated into `node_modules/.prisma` (rejected: the seed cannot import it cleanly),
`prisma-client-js` generator (rejected: deprecated in Prisma 7).

### Current Implementation

`generator client { provider = "prisma-client"; output = "../src/generated/prisma" }`,
`src/lib/db.ts` singleton with `globalThis` caching outside production.

### Important

A fresh clone must run `npm run db:generate` before typecheck/tests/build. Never edit
`src/generated/**`.

## Decision: Local PostgreSQL via Docker Compose

### Decision

`docker-compose.yml` runs `postgres:16-alpine` as container `formplatform-postgres` on port 5432
with a named volume and a `pg_isready` healthcheck.

### Reason

Reproducible local database without installing PostgreSQL, matching `DATABASE_URL` in `.env.example`.

### Alternatives Considered

Hosted Postgres / Prisma Postgres (rejected for now: no deployment target decided), SQLite
(rejected: PRD specifies PostgreSQL).

### Current Implementation

Running and healthy; `.env` points at `localhost:5432/formplatform`.

### Important

Keep the container name and credentials in sync with `.env`. Do not commit `.env`.

## Decision: LAN access allowed for the dev server

### Decision

`next.config.ts` sets `allowedDevOrigins: ["192.168.10.11"]`.

### Reason

The app is developed on one machine and opened from another on the LAN. Next.js 16 blocks dev
cross-origin asset/HMR requests for unknown origins, which breaks the app in that setup.

### Alternatives Considered

Access only via `localhost` (rejected: the LAN workflow is in use), disabling the check (no such
option; the allowlist is the supported mechanism).

### Current Implementation

Hosts only, no port. The dev server restarted itself when the config was added.

### Important

If the LAN IP changes, update this list.

## Decision: Git is not initialized

### Decision

The project is not under version control. `.gitignore` exists and is correct, `git status` fails.

### Reason

Observed state; no decision was recorded to avoid Git.

### Alternatives Considered

Not applicable.

### Current Implementation

No `.git` directory. Changes must be reviewed manually.

### Important

Do not run `git init`, commit, reset or checkout without explicit user instruction. Flag the missing
history in reports.

## Decision: Idempotent seed with a real formula schema

### Decision

`prisma/seed.ts` upserts `demo@example.com` and creates the `Pricing Calculator` form only if the
slug is free, using the app's own `formSchemaSchema` to validate the schema it writes, and wiring
sections, fields, options, formulas and an audit row (including `Field.sectionId`).

### Reason

Gives a realistic multi-section form with chained formulas and conditional logic for manual testing,
and doubles as the reference example of the schema format.

### Alternatives Considered

Minimal empty form (rejected: useless for testing the renderer and formulas).

### Current Implementation

`npm run db:seed`. Re-running keeps the user and skips the form.

### Important

Keep the idempotency check; the seed is run repeatedly during development.

## Decision: README not yet rewritten

### Decision

`README.md` still contains the `create-next-app` default text.

### Reason

Project documentation was carried by the PRD plus conversation context; rewriting it was never done.

### Alternatives Considered

Writing it earlier (not done).

### Current Implementation

Default content only.

### Important

Should be rewritten from `PROJECT_CONTEXT.md`. Low priority — `AI_CONTEXT/` serves agents today.
# Architecture

> Verified against source code on 2026-10-02. Graphify was **not available** in this environment
> (see `AI_CONTEXT/HANDOFF.md` → GRAPHIFY NOTES); the dependency maps below were produced by reading
> every import statement in `src/` and cross-checking `prisma/schema.prisma`.

## High Level Architecture

Actual shape of the code today — a Next.js App Router monolith with a server-action-only write path
and a service layer over Prisma. There is no separate API layer for domain data, no queue, no
background job, no external service.

```
Browser
  │
  ├─ GET  Server Component page  ──►  page (RSC)  ──►  auth-service.requireUser()
  │                                        └─────────►  form-service ──► Prisma ──► PostgreSQL
  │
  └─ POST Server Action (useActionState)
             └─► src/server/actions/*.ts  ──►  auth-service.requireUser()
                                          └─►  form-service / user-service ──► Prisma ──► PostgreSQL
                                                 │
                                                 └─ revalidatePath() / redirect()

Client-only UI (validation, visibility, rendering) lives in src/lib/** and is imported by
"use client" components; the same modules are meant to be reused server-side for the
authoritative check (PRD §79).
```

### Route inventory (from `next build`, 12 routes)

| Route | Type | Auth | Purpose |
|---|---|---|---|
| `/` | static | public | Marketing / entry page |
| `/login` | dynamic | public (redirects to `/dashboard` when signed in) | Sign in |
| `/register` | dynamic | public (same redirect) | Create account |
| `/dashboard` | dynamic | `requireUser()` via `(app)/layout.tsx` | Stats + recent forms |
| `/forms` | dynamic | same | Form table, duplicate/delete |
| `/forms/new` | dynamic | same | Create form (name + description) |
| `/forms/[formId]` | dynamic | same + `getFormForOwner` | Builder: field editor + form settings |
| `/forms/[formId]/preview` | dynamic | same + `getFormForOwner` | Preview renderer |
| `/forms/[formId]/responses` | dynamic | same + `getFormForOwner` | Placeholder (Milestone 7) |
| `/responses` | dynamic | same | Last 10 responses across owned forms |
| `/api/auth/[...nextauth]` | dynamic | public | Auth.js handlers |
| `/_not-found` | static | public | Not found |

**Not implemented:** `/f/[slug]` (public form), any publish/unpublish route, response detail/edit/export.

## Frontend Architecture

### Routing and layouts

- Root layout `src/app/layout.tsx`: Geist fonts, metadata template `"%s | Form Platform"`,
  body is `flex min-h-full flex-col`
- Route groups: `(app)` for the authenticated shell, `(auth)` for login/register. Groups do not
  affect the URL
- `src/app/(app)/layout.tsx` is the single auth gate: `const user = await requireUser()` then renders
  `AppShell`. Pages inside do not repeat the check (they still call it for typing/convenience)
- Dynamic pages use the Next 16 generated `params` typing (`PageProps<"/forms/[formId]">`,
  `await params`)

### Pages

- `dashboard/page.tsx` — `getDashboardStats` + `listForms` in `Promise.all`, renders `StatCard`s and
  the 5 most recently updated forms
- `forms/page.tsx` — full table; `DuplicateFormButton` / `DeleteFormButton` client components
- `forms/new/page.tsx` — renders `CreateFormForm` only
- `forms/[formId]/page.tsx` — builder page. `getFormForOwner` throws `FormActionError` when the form
  is not owned → `notFound()`. Renders `FieldEditor` + `FormMetadataForm` + status/version/slug meta
- `forms/[formId]/preview/page.tsx` — `parseFormSchema(version.schema, emptyFormSchema)` then `FormPreview`
- `forms/[formId]/responses/page.tsx` — placeholder card, no data access
- `responses/page.tsx` — queries `prisma.response` **directly** (the only page that bypasses the
  service layer) and pairs it with `getDashboardStats`

### Components

`src/components/ui` (presentational, no domain knowledge): `button.tsx` (variants primary/secondary/
ghost/danger, sizes), `button-link.tsx`, `card.tsx` (`Card`, `PageHeading`, `StatusBadge` — `StatusBadge`
imports `FormStatus` from the generated Prisma enums), `input.tsx` (`Input`, `Textarea`, `Select`,
`Label`, `FieldError`, `FormBanner` with tone `error | success | info`).

`src/components/auth`: `login-form.tsx`, `register-form.tsx` — `useActionState` against
`loginAction` / `registerAction`.

`src/components/dashboard`: `app-shell.tsx` (server component; header nav + `<form action={logoutAction}>`),
`create-form-form.tsx`, `form-actions.tsx` (duplicate/delete buttons using `useTransition` +
`void action(formId)` for bound actions).

`src/components/form-builder`: `field-editor.tsx` (the builder), `form-metadata-form.tsx`.

`src/components/form-renderer`: `form-renderer.tsx` (the single renderer), `field-input.tsx`
(one switch per field type, plus `ChoiceInput` and `scaleValues`), `form-preview.tsx`
(device width switcher around the renderer).

### State management

None beyond React local state. No context, no store, no URL state.

- `FormRenderer` holds `values`, `errors`, `touched`, `attempted`, `status`, `failure` in `useState`
- `FieldEditor` holds `fields`, `selectedId`, `message`, `error` + `useTransition`; it keeps
  `sections` from the loaded schema verbatim (`const { sections } = stored`) — editing sections is
  explicitly left to Milestone 3 work
- `FormPreview` holds `device`, `resetKey`, `values`

### Form handling

- **Owner/admin forms** (login, register, create form, metadata) — React 19 `useActionState` +
  `action={formAction}` progressive enhancement, server actions in `src/server/actions`
- **Renderer form** (`FormRenderer`) — a plain `<form onSubmit>` with a controlled value map; no
  server action, `onSubmit` is an optional prop. Nothing in the app passes `onSubmit` yet, so the
  renderer currently stops after client-side validation

### Validation

Two layers, one implementation:

- `src/lib/validation/validate.ts` — `validateFieldValue`, `validateFormValues`, `pruneInvisibleValues`,
  `schemaFieldOrder`. Order per PRD §19: required → type → constraint → conditional required
- `formSchemaSchema` (Zod) validates *structure* at the boundary: in `saveSchemaAction` (server) and
  again in `FieldEditor` before submitting (client, for a fast error message)
- No third-party form library (no react-hook-form, no zod resolver)

## Backend Architecture

### API routes

Only `src/app/api/auth/[...nextauth]/route.ts`. All other domain writes are Server Actions.

### Server actions (`src/server/actions`)

`auth-actions.ts` — `registerAction`, `loginAction` (both `useActionState` shaped), `logoutAction`.
`form-actions.ts` — `createFormAction`, `updateFormMetadataAction`, `saveSchemaAction`,
`duplicateFormAction(formId)`, `deleteFormAction(formId)`.

Conventions: every action starts with `requireUser()` (or `auth()` for login/register), validates
input with Zod, calls exactly one service function, then `revalidatePath()` and/or `redirect()`.

> Hard constraint discovered on 2026-10-02: a `"use server"` module may only export `async`
> functions. Exporting a non-function runtime value (e.g. `export const idleState = {...}`) fails the
> route at request time with `Error: A "use server" file can only export async functions, found object`.
> Type-only exports are fine. Shared non-function constants must live outside the actions module.

### Services (`src/server/services`)

- `auth-service.ts` — `getCurrentUser()`, `requireUser()`, `SessionUser` type
- `user-service.ts` — `registerSchema` (Zod), `ActionState` type, `IDLE_STATE`,
  `registerUser()` (duplicate email check, bcrypt hash cost 12)
- `form-service.ts` — `FormActionError`, `uniqueSlug`, `createForm`, `listForms`, `getFormForOwner`,
  `updateFormMetadata`, `saveFormSchema`, `duplicateForm`, `deleteForm`, `getDashboardStats`

All services start with `import "server-only"` and take `ownerId` explicitly (no implicit session
lookup), so every call site is auditable.

### Utilities

`src/lib/db.ts` (Prisma singleton on `globalThis` in non-production, re-exports `toJson`),
`src/lib/json.ts` (`toJson` — `JSON.parse(JSON.stringify(x))` narrowed to `Prisma.InputJsonValue`,
used for every JSON column write), `src/lib/utils.ts` (`cn`, `formatDate`, `formatDateTime`,
`formatNumber` — `en-GB` dates, `en-US` numbers).

### Middleware

None. No `middleware.ts` / `proxy.ts`. Route-group layouts + `requireUser()` do the gating.

### Authentication flow

```
/register (client form)
  └─ registerAction ─► registerSchema.safeParse ─► registerUser ─► bcrypt hash + prisma.user.create
                     └─ signIn("credentials", { redirect: false }) ─► Auth.js sets authjs.session-token (JWT/JWE cookie)
                     └─ revalidatePath("/dashboard") ─► redirect("/dashboard")

/login  ─► loginAction ─► signIn("credentials") ─► same cookie

Every (app) request
  └─ AppLayout ─► requireUser() ─► auth() ─► JWT decode ─► session.user.id ─► prisma.user.findUnique
                                              └─ if none: redirect("/login")
```

Cookie name in local dev: `authjs.session-token` (JWE, `HttpOnly`, `SameSite=Lax`, `Path=/`).

### Authorization flow

Ownership, not roles: `form-service` filters on `{ id: formId, ownerId }` for read, update, delete,
duplicate and schema save. `deleteForm` writes an `AuditLog` row, then deletes; cascades remove
versions, sections, fields, options, formulas, settings and responses.

## Database Architecture

Engine PostgreSQL 16, ORM Prisma 7 with driver adapter, one migration
(`20260101000000_init`), all tables `@@map`-ped to snake_case plural names.

### Models and relationships

```
User (users) 1──n Form (forms)              ownerId, cascade delete
User 1──n AuditLog (audit_logs)             actorId, SetNull on delete
User 1──n Account / Session / PasswordResetToken   (Auth.js tables, unused by app code)
User.role: Role(USER|ADMIN)  ── never read by src/

Form 1──n FormVersion (form_versions)       unique(formId, version)   immutable snapshots
Form 1──1 FormSettings (form_settings)      unique(formId)
Form 1──n Response (responses)              via formId, cascade
Form 1──n AuditLog                          via formId, cascade
Form.theme Json, Form.slug unique, Form.status FormStatus(DRAFT|PUBLISHED|CLOSED)
Form.responseCount Int default 0            denormalized counter, never written yet

FormVersion.schema Json                     the canonical schema (source of truth for rendering)
FormVersion 1──n Section (sections)         unique(versionId, fieldId), unique(versionId, position)
FormVersion 1──n Field (fields)             unique(versionId, fieldId), unique(versionId, position)
FormVersion 1──n Formula (formulas)         via fieldRef
FormVersion 1──n Response                   via formVersionId, onDelete: Restrict  ← protects history

Section.versionId → FormVersion (cascade)
Section.fields   ← Field[] ("SectionFields", Field.sectionId, cascade)

Field.type FieldType (18 values)  Field.dataType FieldDataType (9 values)
Field.config/validation/logic Json  Field.position Int
Field 1──n FieldOption (field_options)      unique(fieldRef, value), unique(fieldRef, position)
Field 1──1 Formula (formulas)               fieldRef unique

Response.publicId unique, status ResponseStatus(SUBMITTED|SPAM), ipHash?, userAgent?
Response 1──n ResponseAnswer (response_answers)   unique(responseId, fieldId), value Json
Response 1──n CalculationResult (calculation_results) unique(responseId, fieldId), result Json
Response indexes: (formId, submittedAt), (formVersionId)

AuditLog.index (formId, createdAt)
```

### Two representations of the same schema (important)

A saved schema is stored **twice**:

1. `FormVersion.schema` (Json) — canonical, read by the renderer/preview/parser
2. Relational rows `sections` / `fields` / `field_options` / `formulas` + `form_settings` +
   `form.theme` — written in the same transaction by `saveFormSchema`

Current read path uses **only** representation 1 (`getFormForOwner` selects `versions[0].schema`).
Nothing in `src/` reads the relational field/section rows yet. Two known consequences:

- `saveFormSchema` creates `Section` rows but does **not** set `Field.sectionId` when creating fields,
  so the `fields.sectionId` foreign key stays `null` even for schemas that declare sections
- `duplicateForm` copies `FormVersion.schema` JSON but creates no `Section`/`Field`/`FieldOption`/
  `Formula` rows for the copy

### Indexes and constraints worth knowing

- `forms.slug` unique; slug collisions resolved by `uniqueSlug()` probing `name`, `name-2`, `name-3` …
  (bounded to 1000 attempts, then a timestamp suffix)
- `form_versions (formId, version)` unique — a schema save always appends, never mutates
- `responses.formVersionId` is `onDelete: Restrict`: a version referenced by a response cannot be removed
- `Form.sectionId`-style lookups are not indexed beyond `fields_sectionId_idx`

### Migrations

Single migration folder. `npx prisma migrate status` → "Database schema is up to date!".
Regenerating the client after a schema change: `npm run db:generate` (output `src/generated/prisma`,
gitignored). `prisma7.config.ts` supplies the datasource URL from `DATABASE_URL` for the CLI.

## Dependency Architecture

Derived by enumerating every `import` in `src/` (Graphify unavailable). Condensed to the flows that
matter when changing something.

### Domain write flow (create form)

```
src/app/(app)/forms/new/page.tsx
  └─ CreateFormForm (client)
       └─ createFormAction            src/server/actions/form-actions.ts
            ├─ requireUser()          src/server/services/auth-service.ts → auth() + prisma.user
            ├─ formSchema (Zod meta)
            └─ createForm()           src/server/services/form-service.ts
                 └─ prisma.$transaction: forms → form_versions → audit_logs
                      └─ prisma       src/lib/db.ts (@prisma/adapter-pg)
```
Impact area of changing `createForm`: `create-form-form.tsx`, `form-actions.ts`, `form-service.ts`,
`dashboard` stats, `/forms` list. Nothing else.

### Schema save flow (the builder's core)

```
FieldEditor (client)
  ├─ reads safeParseFormSchema(initialSchema) / formSchemaSchema.safeParse(candidate)
  ├─ src/lib/form-schema: FIELD_TYPES, FIELD_TYPE_META, deriveFieldId, collectFieldIds
  └─ saveSchemaAction → formSchemaSchema.safeParse → saveFormSchema
        └─ $transaction: form_versions → sections → fields → field_options → formulas
                         → forms(theme + settings upsert) → audit_logs
```
Impact area: `field-editor.tsx`, `form-actions.ts`, `form-service.saveFormSchema`, `layout.ts`
(`buildFormBlocks`), `visibility.ts`, `validate.ts`, and the preview page. The schema Zod object in
`src/lib/form-schema/schema.ts` is the contract for all of them.

### Rendering flow (preview today, public form later)

```
/forms/[formId]/preview (server page)
  └─ getFormForOwner → versions[0].schema (Json)
       └─ parseFormSchema(json, emptyFormSchema)      src/lib/form-schema/parse.ts
            └─ FormPreview (client)                   src/components/form-renderer/form-preview.tsx
                 └─ FormRenderer (client, mode="preview")
                      ├─ buildFormBlocks              src/lib/form-schema/layout.ts
                      ├─ isFieldVisible/isFieldRequired  src/lib/form-schema/visibility.ts
                      ├─ coerceFieldValue / normalizeFormValues  values.ts
                      ├─ validateFormValues           src/lib/validation/validate.ts
                      └─ FieldInput per field        src/components/form-renderer/field-input.tsx
                           └─ Input/Select/Textarea   src/components/ui/input.tsx
```

### Shared-library dependency shape

```
src/lib/form-schema/index.ts
  ├── schema.ts      (Zod contract: fieldSchema, sectionSchema, settings, theme, formSchemaSchema)
  ├── field-types.ts (FIELD_TYPE_META, slugify, deriveFieldId, collectFieldIds)  → schema.ts
  ├── values.ts      (coercion, normalizeFormValues, initialFieldValues)           → field-types.ts, schema.ts
  ├── visibility.ts  (evaluateConditions, isFieldVisible/Required)                → schema.ts, values.ts
  ├── layout.ts      (buildFormBlocks, indexFields)                               → schema.ts
  ├── format.ts      (currency/percent/date formatting, formatFieldValue)         → field-types.ts, schema.ts, values.ts
  └── parse.ts       (safeParseFormSchema, parseFormSchema)                       → schema.ts

src/lib/validation/validate.ts → src/lib/form-schema (barrel)                      [no other deps]
src/server/services/form-service.ts → src/lib/db (prisma, toJson), src/lib/form-schema, generated enums
src/server/services/auth-service.ts → src/lib/auth, src/lib/db
src/lib/auth.ts → src/lib/db (prisma for the credentials authorize())
src/lib/db.ts → src/generated/prisma/client, src/lib/json
```

### Cross-cutting rules the graph reveals

- `src/lib/**` and `src/generated/**` must never import from `src/server/**` — the dependency arrow
  only ever points server → lib. `src/app/(app)/responses/page.tsx` importing `@/lib/db` directly is
  the one deliberate exception (page-level query).
- Client components import `@/lib/form-schema` and `@/lib/validation` freely; both are isomorphic
  and free of `server-only` / Prisma imports.
- `src/server/services/*` are `server-only`; `src/components/**` never import them for logic —
  only `SessionUser` type in `app-shell.tsx` (type-only import, erased at build time).

## Payment Architecture

Not present. No provider integration, no checkout flow, no order table, no webhook/callback route,
no payment status handling. `FormSettings` has no payment-related columns. PRD §5 lists payment
gateway as a non-goal for the MVP.

## Email Architecture

Not present. No mailer, no templates, no verification/reset/confirmation flows. Two unused schema
tables exist: `verification_tokens` (Auth.js standard) and `password_reset_tokens`
(`userId`, `tokenHash`, `expiresAt`, `usedAt`). `registerAction` creates the account and signs in
immediately — no verification step.

## File Structure

```
D:\Project\Form
├── AGENTS.md                        # agent rules (nextjs block + project rules)
├── AI_CONTEXT/                      # portable memory for AI agents
│   ├── PROJECT_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── CURRENT_STATE.md
│   ├── DECISIONS.md
│   ├── TODO.md
│   ├── CHANGELOG.md
│   └── HANDOFF.md
├── CLAUDE.md                        # "@AGENTS.md"
├── form-builder-calculation-platform-prd.md   # 2286-line PRD, source of truth for scope
├── package.json                     # scripts: dev/build/start/lint/typecheck/test/db:*/verify
├── next.config.ts                   # allowedDevOrigins for LAN dev access
├── prisma7.config.ts                # Prisma 7 CLI config
├── docker-compose.yml               # postgres:16-alpine, container formplatform-postgres
├── tsconfig.json                    # strict, @/* -> src/*
├── vitest.config.mts                # node env, src/tests/**/*.test.ts
├── eslint.config.mjs                # eslint-config-next core-web-vitals + typescript
├── postcss.config.mjs               # @tailwindcss/postcss
├── .env / .env.example              # gitignored
├── .agents/skills/                  # Prisma skill bundle (proxied via skills-lock.json)
├── prisma
│   ├── schema.prisma                # 16 models, 5 enums
│   ├── seed.ts                      # demo user + "Pricing Calculator" form
│   └── migrations/20260101000000_init/migration.sql
├── public/
└── src
    ├── auth.ts                      # re-export: auth, signIn, signOut
    ├── app
    │   ├── layout.tsx  page.tsx  globals.css  favicon.ico
    │   ├── (auth)/login/page.tsx  (auth)/register/page.tsx
    │   ├── (app)/layout.tsx
    │   ├── (app)/dashboard/page.tsx
    │   ├── (app)/forms/page.tsx
    │   ├── (app)/forms/new/page.tsx
    │   ├── (app)/forms/[formId]/{page,preview/page,responses/page}.tsx
    │   ├── (app)/responses/page.tsx
    │   └── api/auth/[...nextauth]/route.ts
    ├── components
    │   ├── auth/{login-form,register-form}.tsx
    │   ├── dashboard/{app-shell,create-form-form,form-actions}.tsx
    │   ├── form-builder/{field-editor,form-metadata-form}.tsx
    │   ├── form-renderer/{form-renderer,field-input,form-preview}.tsx
    │   └── ui/{button,button-link,card,input}.tsx
    ├── generated/prisma/           # generated, gitignored
    ├── lib
    │   ├── auth.ts  db.ts  json.ts  utils.ts
    │   ├── form-schema/{index,schema,field-types,values,visibility,layout,format,parse}.ts
    │   └── validation/{index,validate}.ts
    ├── server
    │   ├── actions/{auth-actions,form-actions}.ts
    │   └── services/{auth-service,user-service,form-service}.ts
    ├── tests/{form-schema,form-values,validation}.test.ts
    └── types/next-auth.d.ts
```

## Important Files

| File | Purpose | Dependency / Relationship | Important? |
|---|---|---|---|
| `prisma/schema.prisma` | Full data model, 5 enums, 16 models | Everything persistence-related; migration source of truth | Yes — read before any DB work |
| `src/lib/form-schema/schema.ts` | Canonical form schema + Zod contract | Imported by builder, renderer, validation, preview page, `form-service` | Yes — the contract of the product |
| `src/server/services/form-service.ts` | All form reads/writes, transactions, audit log, slug logic | Used by 5 pages and both form action groups | Yes — main write path |
| `src/server/actions/form-actions.ts` | Create / update metadata / save schema / duplicate / delete | `requireUser()` + `form-service`; imported by 3 client components | Yes — the only form write entry point |
| `src/lib/auth.ts` | Auth.js config (credentials, JWT callbacks) | `prisma` for `authorize()`; consumed by `auth-service` and `auth-actions` | Yes |
| `src/server/services/auth-service.ts` | `getCurrentUser` / `requireUser` | `auth()` + `prisma.user`; gates the `(app)` group | Yes |
| `src/components/form-renderer/form-renderer.tsx` | The single renderer for preview/public/edit | `layout`, `visibility`, `values`, `@/lib/validation`, `field-input` | Yes — do not fork it |
| `src/components/form-renderer/field-input.tsx` | Per-type input rendering | `@/components/ui/input`, `form-schema` | Yes — new field types land here |
| `src/lib/validation/validate.ts` | Shared validation engine | `@/lib/form-schema`; client now, server later | Yes |
| `src/lib/form-schema/values.ts` | Coercion + payload normalization | `field-types`, `schema`; security boundary for submissions | Yes |
| `src/components/form-builder/field-editor.tsx` | The builder UI (add/edit/move/delete/save fields) | `form-schema`, `saveSchemaAction` | Yes |
| `src/app/(app)/forms/[formId]/page.tsx` | Builder page composition | `getFormForOwner`, `FieldEditor`, `FormMetadataForm` | Yes |
| `src/app/(app)/forms/[formId]/preview/page.tsx` | Preview page | `parseFormSchema`, `FormPreview` | Medium |
| `prisma/seed.ts` | Demo user + full "Pricing Calculator" schema incl. formulas and conditional logic | Uses the app's own Zod schema and `toJson` | Yes — best schema reference |
| `next.config.ts` | `allowedDevOrigins` for LAN dev | Next dev behaviour | Medium |
| `src/lib/db.ts` | Prisma singleton + driver adapter | Throws without `DATABASE_URL` | Yes |
| `src/lib/json.ts` | `toJson` for JSON columns | Prisma types only | Medium |
| `package.json` | Scripts incl. `verify` (typecheck → lint → test → build) | Defines the verification contract | Yes |
| `src/app/(app)/responses/page.tsx` | Only page querying Prisma directly | `@/lib/db` (architecture exception) | Low |
| `src/generated/prisma/**` | Generated client | Gitignored, regenerated via `npm run db:generate` | Do not edit |
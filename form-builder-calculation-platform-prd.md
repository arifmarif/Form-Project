# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# Custom Form Builder & Calculation Platform

**Document Version:** 1.0  
**Status:** Ready for Development  
**Product Type:** SaaS / Web Application  
**Primary Concept:** Form Builder + Dynamic Calculation Engine

---

## 1. Product Overview

Platform ini adalah aplikasi web-based form builder yang memungkinkan pengguna membuat form secara visual seperti Google Forms, tetapi dengan kemampuan tambahan berupa formula, calculation engine, conditional logic, scoring, validation, dan response management.

Konsep utama:

> **Google Forms + SaaS Dashboard + Formula/Calculation Engine**

Pengguna dapat:
1. Membuat form.
2. Mengedit form.
3. Menambahkan field.
4. Mengatur field.
5. Menentukan validation.
6. Membuat formula.
7. Menghubungkan field satu dengan lainnya.
8. Menampilkan hasil perhitungan secara realtime.
9. Membuat conditional logic.
10. Publish form.
11. Membagikan public URL.
12. Mengumpulkan response.
13. Melihat hasil.
14. Export data.
15. Mengedit form tanpa merusak historical response.

## 2. Product Vision

Platform harus memungkinkan seseorang membuat aplikasi berbasis form sederhana tanpa harus membuat kode sendiri.

Contoh Pricing Calculator:

```text
Product
Quantity
Unit Price
Discount
Tax
----------------
Subtotal
Discount Amount
Tax Amount
Grand Total
```

Formula:

```text
subtotal = quantity * unit_price
discount_amount = subtotal * discount / 100
tax_amount = (subtotal - discount_amount) * tax / 100
grand_total = subtotal - discount_amount + tax_amount
```

## 3. Problem Statement

Form builder tradisional umumnya kuat dalam pengumpulan data tetapi terbatas dalam:
- calculation;
- formula;
- conditional logic;
- dynamic pricing;
- scoring;
- assessment;
- quotation;
- dependency antar-field.

Platform ini menyelesaikan masalah tersebut dengan menyediakan form calculation engine native.

## 4. Goals

### 4.1 Primary Goals

Platform harus dapat:
- membuat form;
- mengedit form;
- drag & drop field;
- membuat validation;
- membuat calculation;
- membuat conditional logic;
- membuat scoring;
- preview realtime;
- publish form;
- menerima submission;
- menyimpan response;
- menghitung nilai secara realtime;
- mengelola response;
- export response.

### 4.2 Secondary Goals

Platform juga harus memiliki:
- autosave;
- undo/redo;
- form versioning;
- templates;
- audit log;
- responsive builder;
- accessibility;
- secure formula parser;
- dependency graph;
- calculation optimization.

## 5. Non-Goals MVP

Untuk MVP, jangan langsung membuat:
- collaboration realtime;
- custom domain;
- payment gateway;
- workflow automation;
- webhook;
- public API;
- marketplace;
- advanced analytics;
- multi-tenant enterprise permission system.

Fitur tersebut masuk roadmap tahap berikutnya.

## 6. User Roles

### 6.1 Form Owner

Permissions:

```text
CREATE
READ
UPDATE
DELETE
PUBLISH
UNPUBLISH
DUPLICATE
VIEW_RESPONSES
EDIT_RESPONSES
EXPORT_RESPONSES
MANAGE_SETTINGS
```

### 6.2 System Admin

Permissions:

```text
MANAGE_USERS
MANAGE_FORMS
VIEW_ALL_RESPONSES
VIEW_AUDIT_LOG
DISABLE_FORM
DELETE_FORM
VIEW_SYSTEM_STATISTICS
```

### 6.3 Responder

Pengguna yang mengisi form. Tidak membutuhkan account untuk public form kecuali form membutuhkan authentication.

## 7. Authentication

Authentication minimal:
- Register
- Login
- Logout
- Forgot Password
- Reset Password
- Email Verification
- Session Management

Password:
- wajib di-hash;
- tidak boleh disimpan plaintext;
- server-side validation;
- secure session.

## 8. Dashboard

Dashboard utama:

```text
Dashboard
│
├── Total Forms
├── Published Forms
├── Draft Forms
├── Closed Forms
└── Total Responses
```

Tambahkan:
- Recent Forms
- Recent Responses

Menu:
- Dashboard
- My Forms
- Create Form
- Responses
- Templates
- Settings

## 9. Form Management

Setiap form memiliki:

```text
id
name
description
status
slug
createdAt
updatedAt
responseCount
```

Status:
- DRAFT
- PUBLISHED
- CLOSED

Actions:
- Edit
- Preview
- Open
- Responses
- Duplicate
- Delete
- Publish
- Close

## 10. Create Form

Saat membuat form:
- Form Name
- Description
- Logo
- Cover Image
- Theme
- Submit Button Text
- Confirmation Message

Default:

```text
status = DRAFT
```

## 11. Form Builder

### Desktop Layout

```text
┌──────────────────────────────────────────────────────────┐
│ Logo │ Form Name │ Save │ Preview │ Publish │ Settings  │
├───────────────┬─────────────────────────┬────────────────┤
│ FIELD TYPES   │      FORM CANVAS       │   PROPERTIES   │
│               │                         │                │
│ Short Text    │  Question 1            │ Label          │
│ Number        │  Question 2            │ Description    │
│ Email         │  Question 3            │ Required       │
│ Dropdown      │                         │ Validation     │
│ Checkbox      │                         │ Formula        │
│ Calculation   │                         │ Visibility     │
└───────────────┴─────────────────────────┴────────────────┘
```

Top toolbar:
- Save
- Preview
- Publish
- Form Settings

## 12. Field Types

### MVP
1. Short Text
2. Long Text
3. Number
4. Email
5. Phone
6. Date
7. Time
8. DateTime
9. Dropdown
10. Multiple Choice
11. Checkbox
12. Rating
13. Linear Scale
14. Currency
15. Percentage
16. Hidden Field
17. Section
18. Calculation

### Phase 2
19. File Upload
20. Signature
21. Address
22. URL
23. Image Choice

## 13. Field Configuration

### General

```text
Label
Description
Placeholder
Required
Default Value
Help Text
```

### Advanced

```text
Field ID
CSS Class
Visibility
Read Only
Disabled
```

### Validation

```text
Min Value
Max Value
Min Length
Max Length
Regex
Email Validation
Number Validation
Custom Validation
```

## 14. Field ID

Setiap field wajib mempunyai ID unik.

Contoh:

```text
customer_name
product
quantity
unit_price
discount
tax
subtotal
grand_total
```

Field ID digunakan oleh formula engine.

Contoh:

```text
quantity * unit_price
```

## 15. Drag & Drop

Field dapat:
- ditambahkan;
- dihapus;
- dipindahkan;
- diduplikasi;
- diubah urutannya.

Gunakan stable ID. Jangan menggunakan array index sebagai permanent identifier.

## 16. Section

Form dapat dibagi menjadi section:

```text
Section 1
Personal Information

Section 2
Company Information

Section 3
Product Information

Section 4
Calculation

Section 5
Confirmation
```

Section dapat:
- create;
- edit;
- delete;
- reorder.

## 17. Form Schema

Form harus menggunakan schema-based architecture.

Contoh:

```json
{
  "fields": [
    {
      "id": "quantity",
      "type": "number",
      "label": "Quantity",
      "required": true
    },
    {
      "id": "price",
      "type": "currency",
      "label": "Price",
      "required": true
    },
    {
      "id": "subtotal",
      "type": "calculation",
      "label": "Subtotal",
      "formula": "quantity * price",
      "readonly": true
    }
  ]
}
```

Schema yang sama harus digunakan oleh:
- Builder
- Preview
- Public Form
- Validation
- Calculation Engine
- Response Editor

## 18. Form Renderer

Buat satu centralized renderer:

```typescript
renderForm(schema)
```

Digunakan untuk:
- Preview
- Public Form
- Response Editing

Gunakan satu renderer dengan mode:
- `preview`
- `public`
- `edit-response`

Jangan membuat tiga implementation form yang berbeda.

## 19. Validation Engine

Validation harus berjalan pada client untuk UX dan server untuk security. Server validation adalah authoritative.

Urutan:

```text
Required validation
↓
Type validation
↓
Constraint validation
↓
Conditional validation
↓
Formula calculation
↓
Calculated value validation
↓
Save
```

Jika gagal, jangan menyimpan submission.

## 20. Conditional Visibility

Contoh:

```text
Do you have a company?
Yes
No
```

Jika:

```text
company_type == "Yes"
```

tampilkan:
- Company Name
- Company Address
- Company NPWP

Jika `No`, field tersebut disembunyikan.

## 21. Conditional Required

Contoh:

```text
employment_status == "Employee"
```

maka:

```text
company_name.required = true
```

Jika status Student:

```text
company_name.required = false
```

## 22. Calculation Engine

Calculation Engine adalah core differentiator platform.

Engine harus mampu:
- Parse Formula
- Validate Formula
- Build Dependency Graph
- Detect Circular Dependency
- Resolve Calculation Order
- Evaluate Formula
- Return Calculation Result

Modul:

```typescript
parseFormula()
validateFormula()
buildDependencyGraph()
detectCircularDependency()
resolveCalculationOrder()
evaluateFormula()
calculateForm()
```

## 23. Supported Operators

### Arithmetic

```text
+
-
*
/
%
```

### Comparison

```text
>
<
>=
<=
==
!=
```

### Logical

```text
AND
OR
NOT
```

### Grouping

```text
()
```

## 24. Built-in Functions

MVP:
- `SUM()`
- `AVG()`
- `MIN()`
- `MAX()`
- `COUNT()`
- `ROUND()`
- `CEIL()`
- `FLOOR()`
- `ABS()`
- `IF()`

Contoh:

```text
SUM(price1, price2, price3)
AVG(score1, score2, score3)
ROUND(total, 2)
IF(quantity >= 10, 10000, 15000)
```

## 25. Formula Builder

User tidak wajib mengetik formula secara manual.

UI:

```text
Target Field

[ Grand Total ]

Formula Builder

[ Subtotal ]
[ - ]
[ Discount ]
[ + ]
[ Tax ]
```

Advanced mode:

```text
subtotal - discount + tax
```

Components:
- Field Selector
- Operator Selector
- Function Selector
- Number Input
- Parentheses
- Formula Preview
- Formula Validation

## 26. Formula Autocomplete

Saat user mengetik `qua`, tampilkan suggestion seperti:

```text
quantity
```

Saat mengetik `IF(`, tampilkan suggestion:
- field;
- operator;
- value.

## 27. Formula Validation

Sebelum formula disimpan:
- Syntax
- Unknown Field
- Circular Dependency
- Invalid Operator
- Invalid Function
- Division by Zero
- Type Mismatch

Contoh:

```text
Field "price_total" does not exist.
Invalid formula syntax.
Circular calculation dependency detected.
```

## 28. Formula Security

WAJIB:
- NO `eval()`
- NO `Function()`
- NO arbitrary JavaScript
- NO user-generated executable code

Formula harus diparse menjadi AST.

Contoh:

```text
quantity * price
```

menjadi:

```text
MULTIPLY
├── quantity
└── price
```

Kemudian hanya operator/function yang di-whitelist yang dapat dieksekusi.

## 29. Data Types

Calculation engine harus memahami:

```text
STRING
NUMBER
BOOLEAN
DATE
DATETIME
CURRENCY
PERCENTAGE
ARRAY
NULL
```

Tidak boleh melakukan operasi matematika terhadap STRING kecuali conversion memang didukung.

## 30. Calculation Field

Calculation field:
- Read Only
- Auto Calculate
- Realtime
- Not Editable

Contoh:

```text
Quantity = 5
Price = 10000

Subtotal = 50000
```

## 31. Dependency Graph

Contoh:

```text
quantity
   │
price
   │
   ▼
subtotal
   │
   ▼
discount_amount
   │
   ▼
tax_amount
   │
   ▼
grand_total
```

Engine harus menentukan execution order menggunakan dependency graph.

## 32. Circular Dependency

Contoh:

```text
A = B + 10
B = A * 2
```

Tidak boleh.

Engine harus menghasilkan:

```text
Circular calculation dependency detected.
```

Gunakan graph traversal / topological sorting untuk mendeteksi dependency cycle.

## 33. Realtime Calculation

Jika:

```text
quantity = 2
price = 10000
```

maka:

```text
subtotal = 20000
```

Jika quantity berubah menjadi 5:

```text
subtotal = 50000
```

Tanpa page reload.

## 34. Optimized Recalculation

Jangan selalu:

```typescript
recalculateAllFields()
```

Gunakan:

```typescript
recalculateAffectedFields(changedField)
```

Contoh:

```text
quantity
 ↓
subtotal
 ↓
discount_amount
 ↓
tax_amount
 ↓
grand_total
```

Field yang tidak berhubungan tidak perlu dihitung ulang.

## 35. Currency

Minimal:
- IDR
- USD
- EUR

Database:

```text
100000
```

Presentation:

```text
Rp 100.000
```

Formatting tidak boleh mengubah nilai numeric.

## 36. Calculation Example

Input:

```text
Product Price = 100000
Quantity = 2
Discount = 5%
Tax = 11%
```

Formula:

```text
subtotal = product_price * quantity
discount_amount = subtotal * discount / 100
tax_amount = (subtotal - discount_amount) * tax / 100
grand_total = subtotal - discount_amount + tax_amount
```

Output:

```text
Subtotal       Rp 200.000
Discount       Rp 10.000
Tax            Rp 20.900
Grand Total    Rp 210.900
```

## 37. Scoring Engine

Calculation engine dapat digunakan untuk scoring.

Contoh:

```text
Question A = 10
Question B = 20
Question C = 5
```

Formula:

```text
A + B + C
```

Result:

```text
35
```

Kategori:

```text
IF(
  score >= 80,
  "Excellent",
  IF(
    score >= 60,
    "Good",
    "Needs Improvement"
  )
)
```

## 38. Public Form

Published form memiliki:

```text
/forms/{slug}
```

Contoh:

```text
/forms/customer-registration
```

atau:

```text
/f/customer-registration
```

Public flow:

```text
Open URL
↓
Load Schema
↓
Render Form
↓
Fill Fields
↓
Calculation
↓
Validation
↓
Submit
```

## 39. Form Status

### DRAFT
Tidak dapat diakses public.

### PUBLISHED
Dapat menerima submission.

### CLOSED
Dapat dilihat tetapi submission ditutup.

## 40. Form Settings

### General

```text
Title
Description
Logo
Theme
```

### Submission

```text
Allow Multiple Responses
Require Login
Submit Button
Confirmation Message
Redirect URL
```

### Security

```text
CAPTCHA
Rate Limit
Submission Limit
Start Date
End Date
```

### Response

```text
Store Responses
Allow Editing
Confirmation Email
```

## 41. Submission Flow

```text
User opens public form
        ↓
Load published version
        ↓
Render schema
        ↓
User fills fields
        ↓
Client validation
        ↓
Realtime calculation
        ↓
Submit
        ↓
Server validation
        ↓
Server calculation
        ↓
Database transaction
        ↓
Save response
        ↓
Save answers
        ↓
Save calculation result
        ↓
Commit
        ↓
Confirmation
```

## 42. Database Transaction

Submission wajib transaction:

```text
BEGIN
   Validate
   Save Response
   Save Answers
   Save Calculation Results
COMMIT
```

Jika error:

```text
ROLLBACK
```

## 43. Response Management

Admin dapat melihat:

```text
Response ID
Submitted At
Name
Email
Status
Calculated Total
```

Actions:
- View
- Edit
- Delete

## 44. Response Detail

Response detail:
- Form Information
- Submission Date
- Answers
- Calculation Results

Contoh:

```text
Customer:
John Doe

Quantity:
5

Unit Price:
Rp10.000

Subtotal:
Rp50.000

Discount:
Rp5.000

Tax:
Rp4.500

Grand Total:
Rp49.500
```

## 45. Response Editing

Admin dapat mengubah response.

Contoh:

```text
Quantity
5 → 10
```

Calculation:

```text
Subtotal
50.000 → 100.000
```

Calculation harus dijalankan kembali.

## 46. Response Filtering

Filter:
- Date
- Status
- Field Value
- Calculation Result

Contoh:

```text
grand_total > 1000000
```

## 47. Response Search

Search berdasarkan:
- Name
- Email
- Response ID
- Field Value

## 48. Response Export

### MVP

```text
CSV
```

### Phase berikutnya

```text
Excel
JSON
PDF
```

Export:
- All
- Filtered
- Selected

## 49. Form Duplication

Duplicate harus menyalin:
- Questions
- Sections
- Settings
- Calculations
- Conditional Logic
- Theme

Tidak menyalin:
- Responses

## 50. Form Versioning

Setiap perubahan struktur menghasilkan version baru.

```text
Version 1
Version 2
Version 3
```

Response lama tetap menunjuk ke `formVersionId`.

Dengan demikian perubahan form tidak merusak historical data.

## 51. Database Architecture

Entity utama:

```text
User
Form
FormVersion
Section
Field
FieldOption
Formula
Response
ResponseAnswer
CalculationResult
FormSettings
Submission
AuditLog
```

Relasi:

```text
User
 │
 └── Form
      │
      ├── FormVersion
      │     ├── Section
      │     │    └── Field
      │     │         └── FieldOption
      │     │
      │     └── Formula
      │
      └── Response
             ├── ResponseAnswer
             └── CalculationResult
```

## 52. Database Principles

Jangan hanya menyimpan calculation result.

Simpan:
1. Original Input
2. Formula
3. Calculation Result

Dengan demikian sistem dapat:
- audit;
- debug;
- recalculate;
- compare;
- historical verification.

## 53. Suggested Prisma Structure

Model minimal:

```text
User
Form
FormVersion
Section
Field
FieldOption
Formula
Response
ResponseAnswer
CalculationResult
FormSettings
AuditLog
```

Relasi harus menggunakan foreign key yang jelas dan cascading behavior yang aman.

## 54. API Architecture

Contoh:

```http
POST /api/forms
GET /api/forms
GET /api/forms/:id
PUT /api/forms/:id
DELETE /api/forms/:id

POST /api/forms/:id/publish
POST /api/forms/:id/unpublish
POST /api/forms/:id/duplicate

GET /api/forms/:id/responses
POST /api/forms/:id/responses

GET /api/responses/:id
PUT /api/responses/:id
DELETE /api/responses/:id
```

Alternatif untuk operasi internal:

```text
Next.js Server Actions
```

## 55. API Security

Setiap protected endpoint harus memeriksa:
- Authentication
- Authorization
- Resource Ownership
- Input Validation
- Rate Limit

User A tidak boleh mengubah form milik User B hanya karena mengetahui ID form.

## 56. Autosave

Builder harus autosave.

State:

```text
Saving...
```

kemudian:

```text
Saved
```

Gunakan debounce, misalnya 500–1000 ms setelah perubahan berhenti.

Draft yang sudah tersimpan tidak boleh hilang ketika browser refresh.

## 57. Undo / Redo

Support:

```text
CTRL + Z
CTRL + SHIFT + Z
```

Undoable operations:
- Add Field
- Delete Field
- Edit Field
- Move Field
- Duplicate Field
- Change Formula
- Change Configuration

## 58. Preview

Preview memiliki:
- Desktop
- Tablet
- Mobile

Preview wajib menjalankan:
- Validation
- Conditional Logic
- Calculation
- Required Fields
- Submit Behaviour

Preview bukan sekadar screenshot UI.

## 59. Templates

Default templates:
- Customer Registration
- Contact Form
- Event Registration
- Order Form
- Survey
- Quiz
- Pricing Calculator

Flow:

```text
Use Template
↓
Create Form
↓
Edit
```

## 60. Audit Log

Catat:
- Form Created
- Form Edited
- Field Added
- Field Deleted
- Formula Changed
- Form Published
- Form Unpublished
- Response Deleted

Contoh:

```text
Arif changed formula:

subtotal * 0.10

to:

subtotal * 0.15
```

## 61. Error Handling

Jangan menampilkan raw technical error.

Bad:

```text
PrismaClientKnownRequestError
```

Good:

```text
Unable to save the form.
Please try again.
```

Formula:

```text
Formula contains an invalid field: quantity_total.
```

## 62. Security Requirements

### Authentication
- Secure password hashing.
- Secure session.
- Authorization check.

### Database
- Parameterized queries melalui Prisma.
- Foreign key constraints.
- Transaction untuk submission.

### Formula
- No `eval()`.
- No arbitrary JS.
- AST parser.
- Whitelisted functions.
- Whitelisted operators.

### Form
- Server-side validation.
- Sanitization.
- Rate limiting.
- Submission limits.

## 63. Performance

Target public form:

```text
LCP < 2.5 seconds
```

Calculation:

```text
Only recalculate affected dependencies.
```

Jangan melakukan full-form recalculation setiap perubahan input jika tidak diperlukan.

## 64. Accessibility

Wajib mendukung:
- Keyboard Navigation
- Focus State
- ARIA Labels
- Semantic HTML
- Screen Reader
- Color Contrast
- Accessible Error Messages

## 65. Responsive Design

### Desktop

```text
3 columns
```

### Tablet

```text
2 columns
```

### Mobile

```text
1 column
```

Properties panel menjadi drawer.

## 66. UI/UX Principles

Design:
- modern;
- clean;
- professional;
- responsive;
- fast;
- intuitive.

Builder harus terasa seperti:

> **Google Forms + Modern SaaS Dashboard**

Hindari:
- excessive modal;
- excessive animation;
- excessive colors;
- overly dense UI.

## 67. Technology Stack

### Frontend

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
```

### Backend

```text
Next.js
Server Actions
API Routes
```

### Database

```text
PostgreSQL
```

### ORM

```text
Prisma
```

### Validation

```text
Zod
```

### Authentication

```text
Auth.js
```

### Testing

```text
Vitest
Playwright
```

## 68. Project Architecture

```text
src/
│
├── app/
│
├── components/
│   ├── form-builder/
│   ├── form-renderer/
│   ├── calculation/
│   ├── dashboard/
│   ├── responses/
│   └── ui/
│
├── lib/
│   ├── calculation-engine/
│   ├── validation/
│   ├── form-schema/
│   └── security/
│
├── server/
│   ├── actions/
│   └── services/
│
├── prisma/
│
└── tests/
```

Calculation engine harus independen dari UI.

## 69. Calculation Engine Module

Struktur:

```text
calculation-engine/
│
├── lexer.ts
├── parser.ts
├── ast.ts
├── validator.ts
├── evaluator.ts
├── dependency-graph.ts
├── circular-dependency.ts
├── execution-order.ts
├── functions.ts
├── operators.ts
└── index.ts
```

Public API:

```typescript
calculateForm({
  fields,
  values,
  formulas
})
```

Return:

```typescript
{
  values,
  calculatedValues,
  errors
}
```

## 70. Testing Strategy

### Unit Test

Wajib test:
- Parser
- Evaluator
- Operators
- Functions
- Validation
- Dependency Graph
- Circular Dependency
- Currency
- IF
- ROUND
- SUM
- AVG

### Integration Test

Test:
- Create Form
- Edit Form
- Publish Form
- Submit Form
- Calculate Response
- Edit Response
- Export Response

### E2E Test

Critical flow:

```text
Create Form
↓
Add Quantity
↓
Add Price
↓
Add Calculation
↓
Formula = quantity * price
↓
Publish
↓
Open Public URL
↓
Quantity = 5
↓
Price = 10000
↓
Subtotal = 50000
↓
Submit
↓
Open Responses
↓
Verify = 50000
```

## 71. MVP Scope

MVP wajib berisi:

### Authentication
- Register
- Login
- Logout

### Dashboard
- Form list
- Statistics

### Form
- Create
- Edit
- Delete
- Duplicate

### Builder
- Drag/drop
- Basic fields
- Field configuration
- Validation

### Calculation
- Formula
- Calculation field
- Operators
- IF
- Dependency graph
- Circular dependency detection

### Logic
- Conditional visibility
- Conditional required

### Publishing
- Preview
- Publish
- Public URL

### Responses
- Submit
- Response list
- Response detail
- CSV export

## 72. Phase 2

Setelah MVP stabil:
- File Upload
- Email Notification
- Response Email
- Advanced Calculation
- Advanced Functions
- Templates
- Versioning
- Audit Log
- Analytics
- PDF Export
- Excel Export
- Custom Themes

## 73. Phase 3

Advanced:
- Multi-user Collaboration
- Team Workspace
- Permission System
- Webhooks
- REST API
- API Keys
- Integrations
- Payment Integration
- Custom Domain
- Advanced Workflow
- Automation

## 74. Implementation Order

```text
1. Project Analysis
        ↓
2. Database Schema
        ↓
3. Authentication
        ↓
4. Dashboard
        ↓
5. Form CRUD
        ↓
6. Form Schema
        ↓
7. Form Builder
        ↓
8. Form Renderer
        ↓
9. Basic Validation
        ↓
10. Public Form
        ↓
11. Submission
        ↓
12. Response Management
        ↓
13. Calculation Engine
        ↓
14. Formula Builder
        ↓
15. Conditional Logic
        ↓
16. Export
        ↓
17. Testing
        ↓
18. Security Audit
        ↓
19. Performance Optimization
```

## 75. Development Rules

Developer tidak boleh:
- membuat mockup tanpa backend;
- menggunakan dummy data sebagai backend;
- menggunakan `eval()`;
- menyimpan password plaintext;
- mempercayai client validation;
- mengabaikan transaction;
- membuat calculation engine tidak deterministic;
- merusak historical response;
- menggunakan `any` secara berlebihan;
- membuat duplicate renderer.

Wajib:
- TypeScript strict;
- reusable components;
- database migration;
- seed data;
- unit tests;
- E2E tests;
- server-side validation;
- secure calculation engine.

## 76. Existing Project Integration

Jika project sudah memiliki codebase, JANGAN rewrite dari awal.

Sebelum implementasi:

```text
Inspect project
↓
Read package.json
↓
Read README
↓
Read AGENTS.md
↓
Read AI_CONTEXT
↓
Inspect architecture
↓
Inspect database
↓
Inspect authentication
↓
Inspect reusable components
↓
Create implementation plan
```

## 77. Graphify

Jika Graphify tersedia:

### Before major change

Gunakan Graphify untuk:
- Dependency
- Component Relationship
- Service Layer
- Database Layer
- Calculation Dependency
- Impact Area

### After major change

Gunakan kembali untuk:
- Verify Dependency
- Verify Architecture
- Detect Broken Relationship

## 78. Core Architecture

```text
                    ┌─────────────────────┐
                    │     USER / OWNER    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      DASHBOARD      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FORM BUILDER     │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
          Form Schema      Validation    Formula Builder
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                    ┌─────────────────────┐
                    │  CALCULATION ENGINE │
                    │                     │
                    │ Parser              │
                    │ AST                 │
                    │ Dependency Graph    │
                    │ Evaluator            │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FORM RENDERER    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PUBLIC FORM     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     SUBMISSION      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    └─────────────────────┘
```

## 79. Server-Side Calculation Principle

Client-side calculation hanya untuk UX. Server-side calculation adalah sumber kebenaran.

Flow:

```text
Browser:
quantity = 5
price = 10000
subtotal = 50000
```

Saat submit:

```text
Server
↓
Load published FormVersion
↓
Load submitted values
↓
Validate
↓
Recalculate formula
↓
Generate authoritative result
↓
Save
```

Dengan demikian user tidak dapat memanipulasi calculated result dari browser.

## 80. Recommended MVP Milestones

### Milestone 1 — Foundation

```text
Project setup
Database
Prisma
Authentication
Basic UI
```

### Milestone 2 — Form Management

```text
Dashboard
Create Form
Edit Form
Delete
Duplicate
```

### Milestone 3 — Builder

```text
Field types
Drag/drop
Properties
Sections
Autosave
```

### Milestone 4 — Renderer

```text
Schema
Renderer
Preview
Public form
Responsive
```

### Milestone 5 — Calculation Engine

```text
Lexer
Parser
AST
Evaluator
Functions
Dependency graph
Circular dependency
```

### Milestone 6 — Dynamic Form

```text
Conditional visibility
Conditional required
Realtime calculation
```

### Milestone 7 — Responses

```text
Submission
Response list
Response detail
Response editing
CSV
```

### Milestone 8 — Hardening

```text
Unit test
Integration test
E2E
Security audit
Performance
Production build
```

## 81. Acceptance Criteria MVP

MVP dinyatakan berhasil apabila user dapat menyelesaikan workflow berikut tanpa coding:

```text
Register
   ↓
Login
   ↓
Create Form
   ↓
Add Number Field: Quantity
   ↓
Add Currency Field: Unit Price
   ↓
Add Calculation Field: Subtotal
   ↓
Set Formula:
quantity * unit_price
   ↓
Preview
   ↓
Publish
   ↓
Open Public URL
   ↓
Enter Quantity = 5
   ↓
Enter Unit Price = 10,000
   ↓
System displays:
Subtotal = 50,000
   ↓
Submit
   ↓
Response saved
   ↓
Calculation result saved
   ↓
Admin opens Responses
   ↓
Response displays:
Quantity = 5
Unit Price = 10,000
Subtotal = 50,000
```

## 82. Definition of Done

Feature dianggap selesai jika:
- Feature implemented
- Database migration succeeds
- TypeScript passes
- ESLint passes
- Build succeeds
- Unit tests pass
- Integration tests pass
- Critical E2E passes
- No existing feature broken
- Calculation engine tested
- Public form works
- Response saved
- Calculation result saved
- Formula secured
- No circular dependency
- Responsive UI
- Error handling

Tidak boleh mengatakan feature selesai apabila verification gagal.

## 83. Final Verification Checklist

### Automated

```text
□ TypeScript check
□ ESLint
□ Unit tests
□ Integration tests
□ Production build
□ E2E tests
```

### Manual

```text
□ Create form
□ Add fields
□ Configure formula
□ Preview
□ Publish
□ Open public URL
□ Submit
□ Verify calculation
□ Verify response
□ Edit form
□ Submit again
□ Verify historical response
```

## 84. Final Product Definition

Produk akhir harus terasa seperti:

```text
Google Forms
        +
Modern SaaS Dashboard
        +
Typeform-style Form Builder
        +
Spreadsheet-like Calculation
        +
Rule/Conditional Engine
        +
Response Management
```

Core differentiation produk bukan sekadar membuat form.

> **User dapat membangun form yang berfungsi sebagai mini application/calculator tanpa harus menulis JavaScript.**

Use cases:
- Registration Form
- Survey
- Customer Feedback
- Quiz
- Assessment
- Pricing Calculator
- Quotation
- Order Form
- Loan Calculator
- Employee Assessment
- Product Calculator
- Event Registration
- Booking Form
- Inventory Request
- Application Form

## 85. Feature Priority Matrix

| Fitur | MVP | Phase 2 | Phase 3 |
|---|---:|---:|---:|
| Authentication | ✓ | | |
| Dashboard | ✓ | | |
| Form CRUD | ✓ | | |
| Drag & Drop Builder | ✓ | | |
| Basic Fields | ✓ | | |
| Validation | ✓ | | |
| Formula Engine | ✓ | | |
| Calculation Field | ✓ | | |
| Conditional Logic | ✓ | | |
| Public Form | ✓ | | |
| Submission | ✓ | | |
| Response Management | ✓ | | |
| CSV Export | ✓ | | |
| File Upload | | ✓ | |
| Email | | ✓ | |
| Templates | | ✓ | |
| Versioning | | ✓ | |
| Audit Log | | ✓ | |
| Analytics | | ✓ | |
| Excel/PDF | | ✓ | |
| Collaboration | | | ✓ |
| Team Workspace | | | ✓ |
| Webhooks | | | ✓ |
| REST API | | | ✓ |
| API Keys | | | ✓ |
| Integrations | | | ✓ |
| Payment | | | ✓ |
| Custom Domain | | | ✓ |
| Automation | | | ✓ |

---

## Final Development Principle

PRD ini harus diperlakukan sebagai source of truth untuk development.

Prioritas utama adalah:

1. **Functional backend, bukan mockup.**
2. **Schema-driven form architecture.**
3. **Satu Form Renderer untuk Preview/Public/Response Editing.**
4. **Calculation Engine terpisah dari UI.**
5. **Formula aman menggunakan parser/AST, bukan `eval()`.**
6. **Server-side calculation sebagai authoritative result.**
7. **Historical response tidak boleh rusak ketika form berubah.**
8. **Semua input divalidasi server-side.**
9. **Submission menggunakan database transaction.**
10. **MVP harus stabil sebelum fitur Phase 2 dan Phase 3 dibuat.**
11. **Semua critical flow harus diuji dengan automated test.**
12. **Jangan menyatakan fitur selesai sebelum verification berhasil.**

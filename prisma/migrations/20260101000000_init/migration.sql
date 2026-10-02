-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FieldType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'TIME', 'DATETIME', 'DROPDOWN', 'MULTIPLE_CHOICE', 'CHECKBOX', 'RATING', 'LINEAR_SCALE', 'CURRENCY', 'PERCENTAGE', 'HIDDEN', 'SECTION', 'CALCULATION');

-- CreateEnum
CREATE TYPE "FieldDataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'DATETIME', 'CURRENCY', 'PERCENTAGE', 'ARRAY', 'NULL');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('SUBMITTED', 'SPAM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "responseCount" INTEGER NOT NULL DEFAULT 0,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "theme" JSONB NOT NULL DEFAULT '{}',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_versions" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "schema" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "sectionId" TEXT,
    "fieldId" TEXT NOT NULL,
    "type" "FieldType" NOT NULL,
    "dataType" "FieldDataType" NOT NULL DEFAULT 'STRING',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "placeholder" TEXT,
    "helpText" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "readOnly" BOOLEAN NOT NULL DEFAULT false,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "cssClass" TEXT,
    "position" INTEGER NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "validation" JSONB NOT NULL DEFAULT '{}',
    "logic" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_options" (
    "id" TEXT NOT NULL,
    "fieldRef" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "field_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formulas" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "fieldRef" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "formulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_settings" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submitButtonText" TEXT NOT NULL DEFAULT 'Submit',
    "confirmationMessage" TEXT NOT NULL DEFAULT 'Thank you, your response has been recorded.',
    "redirectUrl" TEXT,
    "allowMultipleResponses" BOOLEAN NOT NULL DEFAULT true,
    "requireLogin" BOOLEAN NOT NULL DEFAULT false,
    "storeResponses" BOOLEAN NOT NULL DEFAULT true,
    "allowEditResponse" BOOLEAN NOT NULL DEFAULT false,
    "captchaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "rateLimit" INTEGER NOT NULL DEFAULT 10,
    "submissionLimit" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "formVersionId" TEXT NOT NULL,
    "status" "ResponseStatus" NOT NULL DEFAULT 'SUBMITTED',
    "ipHash" TEXT,
    "userAgent" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_answers" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "response_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calculation_results" (
    "id" TEXT NOT NULL,
    "responseId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "formId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "forms_slug_key" ON "forms"("slug");

-- CreateIndex
CREATE INDEX "forms_ownerId_status_idx" ON "forms"("ownerId", "status");

-- CreateIndex
CREATE INDEX "forms_updatedAt_idx" ON "forms"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "form_versions_formId_version_key" ON "form_versions"("formId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "sections_versionId_fieldId_key" ON "sections"("versionId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "sections_versionId_position_key" ON "sections"("versionId", "position");

-- CreateIndex
CREATE INDEX "fields_sectionId_idx" ON "fields"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "fields_versionId_fieldId_key" ON "fields"("versionId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "fields_versionId_position_key" ON "fields"("versionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "field_options_fieldRef_value_key" ON "field_options"("fieldRef", "value");

-- CreateIndex
CREATE UNIQUE INDEX "field_options_fieldRef_position_key" ON "field_options"("fieldRef", "position");

-- CreateIndex
CREATE UNIQUE INDEX "formulas_fieldRef_key" ON "formulas"("fieldRef");

-- CreateIndex
CREATE UNIQUE INDEX "form_settings_formId_key" ON "form_settings"("formId");

-- CreateIndex
CREATE UNIQUE INDEX "responses_publicId_key" ON "responses"("publicId");

-- CreateIndex
CREATE INDEX "responses_formId_submittedAt_idx" ON "responses"("formId", "submittedAt");

-- CreateIndex
CREATE INDEX "responses_formVersionId_idx" ON "responses"("formVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "response_answers_responseId_fieldId_key" ON "response_answers"("responseId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "calculation_results_responseId_fieldId_key" ON "calculation_results"("responseId", "fieldId");

-- CreateIndex
CREATE INDEX "audit_logs_formId_createdAt_idx" ON "audit_logs"("formId", "createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_options" ADD CONSTRAINT "field_options_fieldRef_fkey" FOREIGN KEY ("fieldRef") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "form_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formulas" ADD CONSTRAINT "formulas_fieldRef_fkey" FOREIGN KEY ("fieldRef") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_settings" ADD CONSTRAINT "form_settings_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_formVersionId_fkey" FOREIGN KEY ("formVersionId") REFERENCES "form_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_answers" ADD CONSTRAINT "response_answers_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calculation_results" ADD CONSTRAINT "calculation_results_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_formId_fkey" FOREIGN KEY ("formId") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;


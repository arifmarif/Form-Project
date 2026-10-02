import "server-only";
import { slugify, type FieldDataType, type FieldType, type FormSchema } from "@/lib/form-schema";
import { prisma, toJson } from "@/lib/db";
import type { FieldDataType as DbFieldDataType, FieldType as DbFieldType, FormStatus } from "@/generated/prisma/enums";

export class FormActionError extends Error {}

async function uniqueSlug(base: string): Promise<string> {
  const root = base.length > 0 ? base : "form";
  let candidate = root;
  let counter = 2;
  // Bounded probe; collisions beyond this are practically impossible locally.
  while (counter < 1000) {
    const existing = await prisma.form.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing) return candidate;
    candidate = `${root}-${counter}`;
    counter += 1;
  }
  return `${root}-${Date.now()}`;
}

export async function createForm(input: {
  ownerId: string;
  name: string;
  description: string | null;
  schema?: FormSchema;
}) {
  const slug = await uniqueSlug(await makeSlug(input.name));

  return prisma.$transaction(async (tx) => {
    const form = await tx.form.create({
      data: {
        name: input.name,
        description: input.description,
        slug,
        ownerId: input.ownerId,
        settings: { create: {} },
      },
      select: { id: true, slug: true },
    });

    const version = await tx.formVersion.create({
      data: { formId: form.id, version: 1, schema: toJson(input.schema ?? { sections: [], fields: [], settings: {}, theme: {} }) },
      select: { id: true, version: true },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.ownerId,
        formId: form.id,
        action: "FORM_CREATED",
        entity: "form",
        entityId: form.id,
        after: { name: input.name, version: version.version },
      },
    });

    return form;
  });
}

async function makeSlug(name: string): Promise<string> {
  return slugify(name);
}

export async function listForms(ownerId: string, filter?: { status?: FormStatus }) {
  return prisma.form.findMany({
    where: { ownerId, ...(filter?.status ? { status: filter.status } : {}) },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      status: true,
      responseCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getFormForOwner(ownerId: string, formId: string) {
  const form = await prisma.form.findFirst({
    where: { id: formId, ownerId },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      status: true,
      responseCount: true,
      createdAt: true,
      updatedAt: true,
      theme: true,
      logoUrl: true,
      coverUrl: true,
      versions: {
        orderBy: { version: "desc" },
        take: 1,
        select: { id: true, version: true, schema: true },
      },
      settings: true,
    },
  });

  if (!form) throw new FormActionError("Form not found.");
  return form;
}

export async function updateFormMetadata(input: {
  ownerId: string;
  formId: string;
  name: string;
  description: string | null;
}) {
  const existing = await prisma.form.findFirst({
    where: { id: input.formId, ownerId: input.ownerId },
    select: { id: true },
  });
  if (!existing) throw new FormActionError("Form not found.");

  await prisma.form.update({
    where: { id: input.formId },
    data: { name: input.name, description: input.description },
  });

  await prisma.auditLog.create({
    data: {
      actorId: input.ownerId,
      formId: input.formId,
      action: "FORM_EDITED",
      entity: "form",
      entityId: input.formId,
      after: { name: input.name, description: input.description },
    },
  });
}

const DB_TYPE_BY_FIELD_TYPE: Record<FieldType, FieldDataType> = {
  short_text: "string",
  long_text: "string",
  number: "number",
  email: "string",
  phone: "string",
  date: "date",
  time: "string",
  datetime: "datetime",
  dropdown: "string",
  multiple_choice: "string",
  checkbox: "array",
  rating: "number",
  linear_scale: "number",
  currency: "currency",
  percentage: "percentage",
  hidden: "string",
  section: "null",
  calculation: "number",
};

const DB_FIELD_TYPE = (type: FieldType): DbFieldType => type.toUpperCase() as DbFieldType;

const DB_DATA_TYPE = (type: FieldType): DbFieldDataType =>
  DB_TYPE_BY_FIELD_TYPE[type].toUpperCase() as DbFieldDataType;

export async function saveFormSchema(input: {
  ownerId: string;
  formId: string;
  schema: FormSchema;
}) {
  const existing = await prisma.form.findFirst({
    where: { id: input.formId, ownerId: input.ownerId },
    select: {
      id: true,
      slug: true,
      versions: { orderBy: { version: "desc" }, take: 1, select: { version: true } },
    },
  });
  if (!existing) throw new FormActionError("Form not found.");

  const nextVersion = (existing.versions[0]?.version ?? 0) + 1;

  await prisma.$transaction(async (tx) => {
    const version = await tx.formVersion.create({
      data: { formId: existing.id, version: nextVersion, schema: toJson(input.schema) },
      select: { id: true },
    });

    for (const [position, section] of input.schema.sections.entries()) {
      await tx.section.create({
        data: {
          versionId: version.id,
          fieldId: section.id,
          label: section.label,
          title: section.title,
          description: section.description ?? null,
          position,
        },
        select: { id: true },
      });
    }

    for (const [position, field] of input.schema.fields.entries()) {
      const created = await tx.field.create({
        data: {
          versionId: version.id,
          fieldId: field.id,
          type: DB_FIELD_TYPE(field.type),
          dataType: DB_DATA_TYPE(field.type),
          label: field.label,
          description: field.description ?? null,
          placeholder: field.placeholder ?? null,
          helpText: field.helpText ?? null,
          required: field.required,
          readOnly: field.readOnly,
          cssClass: field.cssClass ?? null,
          position,
          config: toJson(field.config),
          validation: toJson(field.validation),
          logic: toJson(field.logic),
        },
        select: { id: true },
      });
      for (const [optionPosition, option] of (field.config.options ?? []).entries()) {
        await tx.fieldOption.create({
          data: {
            fieldRef: created.id,
            value: option.value,
            label: option.label,
            position: optionPosition,
          },
        });
      }

      if (field.type === "calculation" && field.formula) {
        await tx.formula.create({
          data: { versionId: version.id, fieldRef: created.id, expression: field.formula },
        });
      }
    }

    await tx.form.update({
      where: { id: existing.id },
      data: {
        theme: toJson(input.schema.theme),
        settings: {
          upsert: {
            create: {
              submitButtonText: input.schema.settings.submitButtonText,
              confirmationMessage: input.schema.settings.confirmationMessage,
              redirectUrl: input.schema.settings.redirectUrl || null,
              allowMultipleResponses: input.schema.settings.allowMultipleResponses,
              requireLogin: input.schema.settings.requireLogin,
              storeResponses: input.schema.settings.storeResponses,
              allowEditResponse: input.schema.settings.allowEditResponse,
              captchaEnabled: input.schema.settings.captchaEnabled,
              rateLimit: input.schema.settings.rateLimit,
              submissionLimit: input.schema.settings.submissionLimit ?? null,
              startDate: input.schema.settings.startDate ? new Date(input.schema.settings.startDate) : null,
              endDate: input.schema.settings.endDate ? new Date(input.schema.settings.endDate) : null,
            },
            update: {
              submitButtonText: input.schema.settings.submitButtonText,
              confirmationMessage: input.schema.settings.confirmationMessage,
              redirectUrl: input.schema.settings.redirectUrl || null,
              allowMultipleResponses: input.schema.settings.allowMultipleResponses,
              requireLogin: input.schema.settings.requireLogin,
              storeResponses: input.schema.settings.storeResponses,
              allowEditResponse: input.schema.settings.allowEditResponse,
              captchaEnabled: input.schema.settings.captchaEnabled,
              rateLimit: input.schema.settings.rateLimit,
              submissionLimit: input.schema.settings.submissionLimit ?? null,
              startDate: input.schema.settings.startDate ? new Date(input.schema.settings.startDate) : null,
              endDate: input.schema.settings.endDate ? new Date(input.schema.settings.endDate) : null,
            },
          },
        },
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.ownerId,
        formId: existing.id,
        action: "FORM_SCHEMA_SAVED",
        entity: "form_version",
        entityId: version.id,
        after: { version: nextVersion, fieldCount: input.schema.fields.length },
      },
    });
  });
}

export async function duplicateForm(input: { ownerId: string; formId: string }) {
  const source = await getFormForOwner(input.ownerId, input.formId);
  const latest = source.versions[0];
  if (!latest) throw new FormActionError("Form has no version to duplicate.");

  const slug = await uniqueSlug(`${source.slug}-copy`);
  const schema = latest.schema as unknown as FormSchema;

  return prisma.$transaction(async (tx) => {
    const copy = await tx.form.create({
      data: {
        name: `${source.name} (copy)`,
        description: source.description,
        slug,
        status: "DRAFT",
        ownerId: input.ownerId,
        theme: toJson(source.theme),
        logoUrl: source.logoUrl,
        coverUrl: source.coverUrl,
        settings: source.settings
          ? {
              create: {
                submitButtonText: source.settings.submitButtonText,
                confirmationMessage: source.settings.confirmationMessage,
                redirectUrl: source.settings.redirectUrl,
                allowMultipleResponses: source.settings.allowMultipleResponses,
                requireLogin: source.settings.requireLogin,
                storeResponses: source.settings.storeResponses,
                allowEditResponse: source.settings.allowEditResponse,
                captchaEnabled: source.settings.captchaEnabled,
                rateLimit: source.settings.rateLimit,
                submissionLimit: source.settings.submissionLimit,
                startDate: source.settings.startDate,
                endDate: source.settings.endDate,
              },
            }
          : undefined,
      },
      select: { id: true, slug: true },
    });

    await tx.formVersion.create({
      data: { formId: copy.id, version: 1, schema: toJson(latest.schema) },
    });

    await tx.auditLog.create({
      data: {
        actorId: input.ownerId,
        formId: copy.id,
        action: "FORM_DUPLICATED",
        entity: "form",
        entityId: copy.id,
        after: { sourceFormId: source.id, schema: toJson(schema) },
      },
    });

    return copy;
  });
}

export async function deleteForm(input: { ownerId: string; formId: string }) {
  const existing = await prisma.form.findFirst({
    where: { id: input.formId, ownerId: input.ownerId },
    select: { id: true },
  });
  if (!existing) throw new FormActionError("Form not found.");

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.create({
      data: {
        actorId: input.ownerId,
        action: "FORM_DELETED",
        entity: "form",
        entityId: existing.id,
      },
    });
    await tx.form.delete({ where: { id: existing.id } });
  });
}

export async function getDashboardStats(ownerId: string) {
  const [totalForms, drafts, published, closed, responses] = await Promise.all([
    prisma.form.count({ where: { ownerId } }),
    prisma.form.count({ where: { ownerId, status: "DRAFT" } }),
    prisma.form.count({ where: { ownerId, status: "PUBLISHED" } }),
    prisma.form.count({ where: { ownerId, status: "CLOSED" } }),
    prisma.form.aggregate({ where: { ownerId }, _sum: { responseCount: true } }),
  ]);

  return {
    totalForms,
    drafts,
    published,
    closed,
    totalResponses: responses._sum.responseCount ?? 0,
  };
}

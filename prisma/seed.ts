import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { formSchemaSchema } from "../src/lib/form-schema";
import { toJson } from "../src/lib/json";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "Password123";

const pricingSchema = formSchemaSchema.parse({
  sections: [
    { id: "order_info", label: "Order Information", title: "Order Information" },
    { id: "calculation", label: "Calculation", title: "Calculation" },
  ],
  fields: [
    {
      id: "customer_name",
      sectionId: "order_info",
      type: "short_text",
      label: "Customer Name",
      required: true,
      readOnly: false,
      config: {},
      validation: { minLength: 2, maxLength: 120 },
      logic: {},
    },
    {
      id: "customer_email",
      sectionId: "order_info",
      type: "email",
      label: "Customer Email",
      required: true,
      readOnly: false,
      config: {},
      validation: { email: true },
      logic: {},
    },
    {
      id: "product",
      sectionId: "order_info",
      type: "dropdown",
      label: "Product",
      required: true,
      readOnly: false,
      config: {
        options: [
          { value: "standard", label: "Standard Plan" },
          { value: "pro", label: "Pro Plan" },
          { value: "enterprise", label: "Enterprise Plan" },
        ],
      },
      validation: {},
      logic: {},
    },
    {
      id: "quantity",
      sectionId: "order_info",
      type: "number",
      label: "Quantity",
      required: true,
      readOnly: false,
      config: {},
      validation: { min: 1, integer: true },
      logic: {},
    },
    {
      id: "unit_price",
      sectionId: "order_info",
      type: "currency",
      label: "Unit Price",
      required: true,
      readOnly: false,
      config: { currency: "IDR" },
      validation: { min: 0 },
      logic: {},
    },
    {
      id: "discount",
      sectionId: "order_info",
      type: "percentage",
      label: "Discount (%)",
      required: false,
      readOnly: false,
      config: {},
      validation: { min: 0, max: 100 },
      logic: {},
    },
    {
      id: "tax",
      sectionId: "order_info",
      type: "percentage",
      label: "Tax (%)",
      required: false,
      readOnly: false,
      config: {},
      validation: { min: 0, max: 100 },
      logic: {},
    },
    {
      id: "company_name",
      sectionId: "order_info",
      type: "short_text",
      label: "Company Name",
      required: false,
      readOnly: false,
      config: {},
      validation: {},
      logic: {
        visibleWhen: [{ fieldId: "has_company", operator: "equals", value: "Yes" }],
        requiredWhen: [{ fieldId: "has_company", operator: "equals", value: "Yes" }],
      },
    },
    {
      id: "has_company",
      sectionId: "order_info",
      type: "multiple_choice",
      label: "Do you have a company?",
      required: false,
      readOnly: false,
      config: {
        options: [
          { value: "Yes", label: "Yes" },
          { value: "No", label: "No" },
        ],
      },
      validation: {},
      logic: {},
    },
    {
      id: "subtotal",
      sectionId: "calculation",
      type: "calculation",
      label: "Subtotal",
      formula: "quantity * unit_price",
      required: false,
      readOnly: true,
      config: {},
      validation: {},
      logic: {},
    },
    {
      id: "discount_amount",
      sectionId: "calculation",
      type: "calculation",
      label: "Discount Amount",
      formula: "subtotal * discount / 100",
      required: false,
      readOnly: true,
      config: {},
      validation: {},
      logic: {},
    },
    {
      id: "tax_amount",
      sectionId: "calculation",
      type: "calculation",
      label: "Tax Amount",
      formula: "(subtotal - discount_amount) * tax / 100",
      required: false,
      readOnly: true,
      config: {},
      validation: {},
      logic: {},
    },
    {
      id: "grand_total",
      sectionId: "calculation",
      type: "calculation",
      label: "Grand Total",
      formula: "subtotal - discount_amount + tax_amount",
      required: false,
      readOnly: true,
      config: { currency: "IDR" },
      validation: {},
      logic: {},
    },
  ],
  settings: {
    submitButtonText: "Send Quotation",
    confirmationMessage: "Your quotation request has been received.",
    redirectUrl: "",
    allowMultipleResponses: true,
    requireLogin: false,
    storeResponses: true,
    allowEditResponse: false,
    captchaEnabled: false,
    rateLimit: 10,
  },
  theme: { primaryColor: "#4f46e5", fontFamily: "sans", radius: "md" },
});

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Demo Owner", passwordHash },
    create: {
      email: DEMO_EMAIL,
      name: "Demo Owner",
      passwordHash,
    },
    select: { id: true },
  });

  const existing = await prisma.form.findFirst({
    where: { ownerId: user.id, slug: "pricing-calculator" },
    select: { id: true },
  });

  if (existing) {
    console.log(`Seed skipped: form already exists (${existing.id}).`);
    return;
  }

  const form = await prisma.form.create({
    data: {
      name: "Pricing Calculator",
      description: "Quotation form with subtotal, discount, tax and grand total formulas.",
      slug: "pricing-calculator",
      status: "DRAFT",
      ownerId: user.id,
      theme: toJson(pricingSchema.theme),
      settings: {
        create: {
          submitButtonText: pricingSchema.settings.submitButtonText,
          confirmationMessage: pricingSchema.settings.confirmationMessage,
          rateLimit: pricingSchema.settings.rateLimit,
        },
      },
    },
    select: { id: true },
  });

  const version = await prisma.formVersion.create({
    data: { formId: form.id, version: 1, schema: toJson(pricingSchema) },
    select: { id: true },
  });

  const sectionIds = new Map<string, string>();
  for (const [position, section] of pricingSchema.sections.entries()) {
    const created = await prisma.section.create({
      data: {
        versionId: version.id,
        fieldId: section.id,
        label: section.label,
        title: section.title,
        position,
      },
      select: { id: true },
    });
    sectionIds.set(section.id, created.id);
  }

  const fieldTypes = {
    short_text: "SHORT_TEXT",
    long_text: "LONG_TEXT",
    number: "NUMBER",
    email: "EMAIL",
    phone: "PHONE",
    date: "DATE",
    time: "TIME",
    datetime: "DATETIME",
    dropdown: "DROPDOWN",
    multiple_choice: "MULTIPLE_CHOICE",
    checkbox: "CHECKBOX",
    rating: "RATING",
    linear_scale: "LINEAR_SCALE",
    currency: "CURRENCY",
    percentage: "PERCENTAGE",
    hidden: "HIDDEN",
    section: "SECTION",
    calculation: "CALCULATION",
  } as const;

  const dataTypes = {
    short_text: "STRING",
    long_text: "STRING",
    number: "NUMBER",
    email: "STRING",
    phone: "STRING",
    date: "DATE",
    time: "STRING",
    datetime: "DATETIME",
    dropdown: "STRING",
    multiple_choice: "STRING",
    checkbox: "ARRAY",
    rating: "NUMBER",
    linear_scale: "NUMBER",
    currency: "CURRENCY",
    percentage: "PERCENTAGE",
    hidden: "STRING",
    section: "NULL",
    calculation: "NUMBER",
  } as const;

  const sectionOfField: Record<string, string> = {
    customer_name: "order_info",
    customer_email: "order_info",
    has_company: "order_info",
    company_name: "order_info",
    product: "order_info",
    quantity: "order_info",
    unit_price: "order_info",
    discount: "order_info",
    tax: "order_info",
    subtotal: "calculation",
    discount_amount: "calculation",
    tax_amount: "calculation",
    grand_total: "calculation",
  };

  for (const [position, field] of pricingSchema.fields.entries()) {
    const created = await prisma.field.create({
      data: {
        versionId: version.id,
        sectionId: sectionIds.get(sectionOfField[field.id] ?? "") ?? null,
        fieldId: field.id,
        type: fieldTypes[field.type],
        dataType: dataTypes[field.type],
        label: field.label,
        required: field.required,
        readOnly: field.readOnly,
        position,
        config: toJson(field.config),
        validation: toJson(field.validation),
        logic: toJson(field.logic),
      },
      select: { id: true },
    });

    for (const [optionPosition, option] of (field.config.options ?? []).entries()) {
      await prisma.fieldOption.create({
        data: {
          fieldRef: created.id,
          value: option.value,
          label: option.label,
          position: optionPosition,
        },
      });
    }

    if (field.type === "calculation" && field.formula) {
      await prisma.formula.create({
        data: { versionId: version.id, fieldRef: created.id, expression: field.formula },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      formId: form.id,
      action: "FORM_CREATED",
      entity: "form",
      entityId: form.id,
      after: { name: form.id, version: 1, source: "seed" },
    },
  });

  console.log(`Seeded user ${DEMO_EMAIL} (password: ${DEMO_PASSWORD}) and form ${form.id}.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

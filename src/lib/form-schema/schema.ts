import { z } from "zod";

/**
 * Canonical form schema. The same shape drives the builder, the renderer,
 * public forms, validation and the calculation engine (PRD §17).
 */

export const FIELD_TYPES = [
  "short_text",
  "long_text",
  "number",
  "email",
  "phone",
  "date",
  "time",
  "datetime",
  "dropdown",
  "multiple_choice",
  "checkbox",
  "rating",
  "linear_scale",
  "currency",
  "percentage",
  "hidden",
  "section",
  "calculation",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const DATA_TYPES = [
  "string",
  "number",
  "boolean",
  "date",
  "datetime",
  "currency",
  "percentage",
  "array",
  "null",
] as const;

export type FieldDataType = (typeof DATA_TYPES)[number];

/** Field id: lowercase snake_case, starts with a letter. Used by formulas. */
export const fieldIdSchema = z
  .string()
  .min(1, "Field ID is required.")
  .max(64, "Field ID must be 64 characters or fewer.")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Field ID must start with a lowercase letter and contain only lowercase letters, numbers, and underscores.",
  );

export const fieldOptionSchema = z.object({
  value: z.string().min(1).max(120),
  label: z.string().min(1).max(240),
});

export type FieldOption = z.infer<typeof fieldOptionSchema>;

export const fieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(0).optional(),
  pattern: z.string().max(500).optional(),
  email: z.boolean().optional(),
  integer: z.boolean().optional(),
});

export type FieldValidation = z.infer<typeof fieldValidationSchema>;

/** Conditional visibility: field is shown only when `condition` evaluates true. */
export const fieldConditionSchema = z.object({
  fieldId: fieldIdSchema,
  operator: z.enum([
    "equals",
    "not_equals",
    "contains",
    "not_contains",
    "greater_than",
    "less_than",
    "is_answered",
    "is_not_answered",
  ]),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export type FieldCondition = z.infer<typeof fieldConditionSchema>;

export const fieldLogicSchema = z.object({
  /** When present, the field is visible only if every condition passes. */
  visibleWhen: z.array(fieldConditionSchema).optional(),
  /** When present, the field becomes required if every condition passes. */
  requiredWhen: z.array(fieldConditionSchema).optional(),
});

export type FieldLogic = z.infer<typeof fieldLogicSchema>;

export const fieldConfigSchema = z.object({
  options: z.array(fieldOptionSchema).max(200).optional(),
  currency: z.enum(["IDR", "USD", "EUR"]).optional(),
  scaleMin: z.number().int().optional(),
  scaleMax: z.number().int().optional(),
  scaleStep: z.number().positive().optional(),
  rows: z.number().int().min(1).max(20).optional(),
});

export type FieldConfig = z.infer<typeof fieldConfigSchema>;

export const fieldSchema = z
  .object({
    id: fieldIdSchema,
    type: z.enum(FIELD_TYPES),
    label: z.string().min(1, "Label is required.").max(240),
    description: z.string().max(1000).optional(),
    placeholder: z.string().max(240).optional(),
    helpText: z.string().max(1000).optional(),
    required: z.boolean().default(false),
    readOnly: z.boolean().default(false),
    cssClass: z.string().max(120).optional(),
    /** Set when the field is grouped by a declared section (PRD §16). */
    sectionId: fieldIdSchema.optional(),
    defaultValue: z.unknown().optional(),
    config: fieldConfigSchema.default({}),
    validation: fieldValidationSchema.default({}),
    logic: fieldLogicSchema.default({}),
    /** Only for `calculation` fields. */
    formula: z.string().max(2000).optional(),
  })
  .superRefine((field, ctx) => {
    const hasOptions = field.type === "dropdown" || field.type === "multiple_choice" || field.type === "checkbox";
    if (hasOptions && (field.config.options?.length ?? 0) === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["config", "options"],
        message: "At least one option is required.",
      });
    }
    if (field.type === "calculation" && !field.formula?.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["formula"],
        message: "A formula is required for calculation fields.",
      });
    }
  });

export type FormField = z.infer<typeof fieldSchema>;

export const sectionSchema = z.object({
  id: fieldIdSchema,
  label: z.string().min(1).max(240),
  title: z.string().min(1).max(240),
  description: z.string().max(1000).optional(),
});

export type FormSection = z.infer<typeof sectionSchema>;

export const formSettingsSchema = z.object({
  submitButtonText: z.string().min(1).max(80).default("Submit"),
  confirmationMessage: z
    .string()
    .min(1)
    .max(1000)
    .default("Thank you, your response has been recorded."),
  redirectUrl: z.string().url().max(500).optional().or(z.literal("")),
  allowMultipleResponses: z.boolean().default(true),
  requireLogin: z.boolean().default(false),
  storeResponses: z.boolean().default(true),
  allowEditResponse: z.boolean().default(false),
  captchaEnabled: z.boolean().default(false),
  rateLimit: z.number().int().min(1).max(1000).default(10),
  submissionLimit: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type FormSettings = z.infer<typeof formSettingsSchema>;

export const formThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#4f46e5"),
  fontFamily: z.enum(["sans", "serif", "mono"]).default("sans"),
  radius: z.enum(["none", "sm", "md", "lg"]).default("md"),
});

export type FormTheme = z.infer<typeof formThemeSchema>;

export const formSchemaSchema = z
  .object({
    sections: z.array(sectionSchema).max(100).default([]),
    fields: z.array(fieldSchema).max(500),
    settings: formSettingsSchema,
    theme: formThemeSchema,
  })
  .superRefine((schema, ctx) => {
    const seen = new Set<string>();
    for (const [index, field] of schema.fields.entries()) {
      if (seen.has(field.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["fields", index, "id"],
          message: `Duplicate field ID: "${field.id}".`,
        });
      }
      seen.add(field.id);
    }
    for (const [index, section] of schema.sections.entries()) {
      if (seen.has(section.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["sections", index, "id"],
          message: `Duplicate ID: "${section.id}".`,
        });
      }
      seen.add(section.id);
    }
    const sectionIds = new Set(schema.sections.map((section) => section.id));
    for (const [index, field] of schema.fields.entries()) {
      if (field.sectionId && !sectionIds.has(field.sectionId)) {
        ctx.addIssue({
          code: "custom",
          path: ["fields", index, "sectionId"],
          message: `Field "${field.id}" points to unknown section "${field.sectionId}".`,
        });
      }
    }
  });

export type FormSchema = z.infer<typeof formSchemaSchema>;

export const formValuesSchema = z.record(z.string(), z.unknown());

export type FormValues = Record<string, unknown>;

export const emptyFormSchema: FormSchema = {
  sections: [],
  fields: [],
  settings: {
    submitButtonText: "Submit",
    confirmationMessage: "Thank you, your response has been recorded.",
    redirectUrl: "",
    allowMultipleResponses: true,
    requireLogin: false,
    storeResponses: true,
    allowEditResponse: false,
    captchaEnabled: false,
    rateLimit: 10,
  },
  theme: {
    primaryColor: "#4f46e5",
    fontFamily: "sans",
    radius: "md",
  },
};

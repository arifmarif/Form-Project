import {
  buildFormBlocks,
  coerceFieldValue,
  isFieldRequired,
  isFieldVisible,
  isEmptyValue,
  normalizeFormValues,
  type FieldConfig,
  type FormField,
  type FormSchema,
  type FormValues,
} from "@/lib/form-schema";

/**
 * Shared validation engine (PRD §19). Runs on the client for feedback and on
 * the server as the authoritative check — the same code path, so the two can
 * never disagree.
 *
 * Order: required → type → constraint → conditional required.
 */

export type FormValidationResult = {
  valid: boolean;
  /** First error per field id, in schema order. */
  errors: Record<string, string>;
  /** Field ids that produced an error, in schema order. */
  invalidFieldIds: string[];
  /** Known-field values only, coerced, with invisible fields stripped. */
  values: FormValues;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{6,20}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function defaultScale(field: FormField, config: FieldConfig): { min: number; max: number } {
  if (field.type === "rating") return { min: config.scaleMin ?? 1, max: config.scaleMax ?? 5 };
  return { min: config.scaleMin ?? 1, max: config.scaleMax ?? 10 };
}

function isNumericType(field: FormField): boolean {
  return (
    field.type === "number" ||
    field.type === "currency" ||
    field.type === "percentage" ||
    field.type === "rating" ||
    field.type === "linear_scale"
  );
}

function typeError(field: FormField, value: unknown): string | null {
  switch (field.type) {
    case "section":
    case "calculation":
      return null;
    case "number":
    case "currency":
    case "percentage":
    case "rating":
    case "linear_scale": {
      if (typeof value !== "number" || !Number.isFinite(value)) return "Enter a valid number.";
      const { min, max } = defaultScale(field, field.config);
      if ((field.type === "rating" || field.type === "linear_scale") && (value < min || value > max)) {
        return `Choose a value between ${min} and ${max}.`;
      }
      return null;
    }
    case "checkbox": {
      if (!Array.isArray(value)) return "Invalid selection.";
      const options = field.config.options ?? [];
      const known = new Set(options.map((option) => option.value));
      if (value.some((entry) => !known.has(entry))) return "Select one of the available options.";
      return null;
    }
    case "dropdown":
    case "multiple_choice": {
      const options = field.config.options ?? [];
      if (typeof value !== "string") return "Select one of the available options.";
      if (!options.some((option) => option.value === value)) return "Select one of the available options.";
      return null;
    }
    case "email":
      return typeof value === "string" && EMAIL_PATTERN.test(value.trim())
        ? null
        : "Enter a valid email address.";
    case "phone":
      return typeof value === "string" && PHONE_PATTERN.test(value.trim())
        ? null
        : "Enter a valid phone number.";
    case "date":
      return typeof value === "string" && isValidDateString(value) ? null : "Select a valid date.";
    case "time":
      return typeof value === "string" && TIME_PATTERN.test(value) ? null : "Select a valid time.";
    case "datetime":
      return typeof value === "string" && !Number.isNaN(new Date(value).getTime())
        ? null
        : "Select a valid date and time.";
    default:
      return typeof value === "string" ? null : "Enter a valid value.";
  }
}

function constraintErrors(field: FormField, value: unknown): string | null {
  const validation = field.validation;

  if (isNumericType(field) && typeof value === "number") {
    if (validation.integer && !Number.isInteger(value)) return "Enter a whole number.";
    if (validation.min !== undefined && value < validation.min) {
      return `Value must be ${validation.min} or more.`;
    }
    if (validation.max !== undefined && value > validation.max) {
      return `Value must be ${validation.max} or less.`;
    }
  }

  if (typeof value === "string") {
    const length = value.trim().length;
    if (validation.minLength !== undefined && length < validation.minLength) {
      return `Use at least ${validation.minLength} characters.`;
    }
    if (validation.maxLength !== undefined && length > validation.maxLength) {
      return `Use at most ${validation.maxLength} characters.`;
    }
    if (validation.pattern) {
      try {
        if (!new RegExp(validation.pattern).test(value)) {
          return "Value does not match the required format.";
        }
      } catch {
        return "This field has an invalid format rule.";
      }
    }
  }

  if (Array.isArray(value) && validation.minLength !== undefined && value.length < validation.minLength) {
    return `Select at least ${validation.minLength} options.`;
  }

  return null;
}

/** Error message for a single field, or null when the value is acceptable. */
export function validateFieldValue(field: FormField, raw: unknown, values: FormValues): string | null {
  if (field.type === "section" || field.type === "calculation") return null;

  const value = coerceFieldValue(field, raw);

  if (isEmptyValue(value)) {
    return isFieldRequired(field, values) ? "This field is required." : null;
  }

  const typeIssue = typeError(field, value);
  if (typeIssue) return typeIssue;

  return constraintErrors(field, value);
}

/** Drops values of fields that are currently hidden so nothing stale is stored. */
export function pruneInvisibleValues(schema: FormSchema, values: FormValues): FormValues {
  const result: FormValues = {};
  for (const field of schema.fields) {
    if (field.type === "section" || field.type === "calculation") continue;
    if (!(field.id in values)) continue;
    if (!isFieldVisible(field, values)) continue;
    result[field.id] = values[field.id];
  }
  return result;
}

export function validateFormValues({
  schema,
  values,
}: {
  schema: FormSchema;
  values: FormValues;
}): FormValidationResult {
  const errors: Record<string, string> = {};
  const invalidFieldIds: string[] = [];

  // Visibility is resolved against the submitted values first, then validated.
  const visibleValues = pruneInvisibleValues(schema, values);

  for (const field of schema.fields) {
    if (field.type === "section" || field.type === "calculation") continue;
    if (!isFieldVisible(field, visibleValues)) continue;

    const message = validateFieldValue(field, visibleValues[field.id], visibleValues);
    if (message) {
      errors[field.id] = message;
      invalidFieldIds.push(field.id);
    }
  }

  return {
    valid: invalidFieldIds.length === 0,
    errors,
    invalidFieldIds,
    values: normalizeFormValues(schema, visibleValues),
  };
}

/** Ordered field ids of a schema, used to focus the first invalid field. */
export function schemaFieldOrder(schema: Pick<FormSchema, "fields" | "sections">): string[] {
  return buildFormBlocks(schema).flatMap((block) => block.fields.map((field) => field.id));
}
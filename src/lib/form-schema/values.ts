import { FIELD_TYPE_META } from "./field-types";
import type { FormField, FormSchema, FormValues } from "./schema";

/**
 * Value model shared by the renderer, the validation engine and submission.
 * Text-like fields keep strings, numeric fields keep numbers, checkbox keeps
 * string[]. Everything else is normalised through `coerceFieldValue` so the
 * client and the server agree on the stored shape.
 */

export function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (typeof value === "number") return Number.isNaN(value);
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function parseNumeric(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/\s/g, "").replace(/,/g, ".");
    if (cleaned.length === 0) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  if (typeof raw === "string" && raw.length > 0) return [raw];
  return [];
}

const NUMERIC_TYPES = new Set<FormField["type"]>([
  "number",
  "rating",
  "linear_scale",
  "currency",
  "percentage",
  "calculation",
]);

/** Normalises a raw value (string from the DOM, or a stored value) for a field. */
export function coerceFieldValue(field: FormField, raw: unknown): unknown {
  if (isEmptyValue(raw)) {
    return FIELD_TYPE_META[field.type].dataType === "array" ? [] : null;
  }

  if (NUMERIC_TYPES.has(field.type)) return parseNumeric(raw);

  if (field.type === "checkbox") return parseStringArray(raw);

  if (typeof raw === "string") return raw;

  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);

  return null;
}

/** Seed values for a fresh response, honouring configured defaults. */
export function initialFieldValues(schema: FormSchema): FormValues {
  const values: FormValues = {};
  for (const field of schema.fields) {
    if (field.type === "section") continue;
    if (field.defaultValue === undefined) continue;
    values[field.id] = coerceFieldValue(field, field.defaultValue);
  }
  return values;
}

/**
 * Keeps only values that belong to a known field, coerced to the field type.
 * Used before submit and by the server, so a crafted payload cannot smuggle
 * unknown keys into the response payload (PRD §62).
 */
export function normalizeFormValues(schema: FormSchema, values: FormValues): FormValues {
  const result: FormValues = {};
  for (const field of schema.fields) {
    if (field.type === "section") continue;
    if (!(field.id in values)) continue;
    const coerced = coerceFieldValue(field, values[field.id]);
    if (!isEmptyValue(coerced)) result[field.id] = coerced;
  }
  return result;
}
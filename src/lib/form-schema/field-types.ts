import { type FieldDataType, type FieldType, fieldIdSchema, type FormSchema } from "./schema";

export const FIELD_TYPE_META: Record<
  FieldType,
  { label: string; dataType: FieldDataType; hasOptions: boolean; readOnly: boolean }
> = {
  short_text: { label: "Short Text", dataType: "string", hasOptions: false, readOnly: false },
  long_text: { label: "Long Text", dataType: "string", hasOptions: false, readOnly: false },
  number: { label: "Number", dataType: "number", hasOptions: false, readOnly: false },
  email: { label: "Email", dataType: "string", hasOptions: false, readOnly: false },
  phone: { label: "Phone", dataType: "string", hasOptions: false, readOnly: false },
  date: { label: "Date", dataType: "date", hasOptions: false, readOnly: false },
  time: { label: "Time", dataType: "string", hasOptions: false, readOnly: false },
  datetime: { label: "Date & Time", dataType: "datetime", hasOptions: false, readOnly: false },
  dropdown: { label: "Dropdown", dataType: "string", hasOptions: true, readOnly: false },
  multiple_choice: { label: "Multiple Choice", dataType: "string", hasOptions: true, readOnly: false },
  checkbox: { label: "Checkbox", dataType: "array", hasOptions: true, readOnly: false },
  rating: { label: "Rating", dataType: "number", hasOptions: false, readOnly: false },
  linear_scale: { label: "Linear Scale", dataType: "number", hasOptions: false, readOnly: false },
  currency: { label: "Currency", dataType: "currency", hasOptions: false, readOnly: false },
  percentage: { label: "Percentage", dataType: "percentage", hasOptions: false, readOnly: false },
  hidden: { label: "Hidden Field", dataType: "string", hasOptions: false, readOnly: false },
  section: { label: "Section", dataType: "null", hasOptions: false, readOnly: false },
  calculation: { label: "Calculation", dataType: "number", hasOptions: false, readOnly: true },
};

/** Fields rendered as a choice set inside a fieldset (legend instead of label). */
const GROUP_FIELD_TYPES = new Set<FieldType>([
  "multiple_choice",
  "checkbox",
  "rating",
  "linear_scale",
]);

export function isGroupFieldType(type: FieldType): boolean {
  return GROUP_FIELD_TYPES.has(type);
}

const NUMERIC_FIELD_TYPES = new Set<FieldType>([
  "number",
  "rating",
  "linear_scale",
  "currency",
  "percentage",
  "calculation",
]);

export function isNumericFieldType(type: FieldType): boolean {
  return NUMERIC_FIELD_TYPES.has(type);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Derives a unique, valid field id from a label. */
export function deriveFieldId(label: string, taken: Iterable<string> = []): string {
  const base = slugify(label).replace(/-/g, "_");
  const seed = base.length > 0 ? base : "field";
  const candidate = fieldIdSchema.safeParse(seed);
  const start = candidate.success ? seed : `field_${seed.replace(/[^a-z0-9_]/g, "")}`;
  const used = new Set(taken);
  if (!used.has(start)) return start;
  let counter = 2;
  while (used.has(`${start}_${counter}`)) counter += 1;
  return `${start}_${counter}`;
}

export function collectFieldIds(schema: Pick<FormSchema, "fields" | "sections">): Set<string> {
  return new Set<string>([
    ...schema.fields.map((field) => field.id),
    ...schema.sections.map((section) => section.id),
  ]);
}

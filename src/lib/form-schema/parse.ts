import { formSchemaSchema, type FormSchema } from "./schema";

/** Parses a stored schema (JSON column, request payload) and fills defaults. */
export function safeParseFormSchema(value: unknown): FormSchema | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const candidate = {
    sections: Array.isArray(record.sections) ? record.sections : [],
    fields: Array.isArray(record.fields) ? record.fields : [],
    settings:
      record.settings && typeof record.settings === "object" ? record.settings : undefined,
    theme: record.theme && typeof record.theme === "object" ? record.theme : undefined,
  };
  const parsed = formSchemaSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** Parses a stored schema, falling back to the empty schema. */
export function parseFormSchema(value: unknown, fallback: FormSchema): FormSchema {
  return safeParseFormSchema(value) ?? fallback;
}
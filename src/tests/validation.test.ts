import { describe, expect, it } from "vitest";
import {
  emptyFormSchema,
  isFieldRequired,
  isFieldVisible,
  type FieldType,
  type FormField,
  type FormSchema,
} from "@/lib/form-schema";
import { pruneInvisibleValues, schemaFieldOrder, validateFormValues } from "@/lib/validation";

function field(partial: Partial<FormField> & { id: string; type: FieldType }): FormField {
  return {
    label: partial.id,
    required: false,
    readOnly: false,
    config: {},
    validation: {},
    logic: {},
    ...partial,
  };
}

function schema(fields: FormField[]): FormSchema {
  return { ...emptyFormSchema, fields };
}

const companySchema = schema([
  field({
    id: "has_company",
    type: "multiple_choice",
    config: { options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
  }),
  field({
    id: "company_name",
    type: "short_text",
    logic: { visibleWhen: [{ fieldId: "has_company", operator: "equals", value: "yes" }] },
  }),
  field({
    id: "company_npwp",
    type: "short_text",
    logic: {
      visibleWhen: [{ fieldId: "has_company", operator: "equals", value: "yes" }],
      requiredWhen: [{ fieldId: "has_company", operator: "equals", value: "yes" }],
    },
  }),
]);

describe("conditional visibility", () => {
  it("shows a field only when every condition passes", () => {
    const target = companySchema.fields[1];
    expect(isFieldVisible(target, {})).toBe(false);
    expect(isFieldVisible(target, { has_company: "no" })).toBe(false);
    expect(isFieldVisible(target, { has_company: "yes" })).toBe(true);
  });

  it("treats is_answered on empty and filled values", () => {
    const target = field({
      id: "note",
      type: "short_text",
      logic: { visibleWhen: [{ fieldId: "has_company", operator: "is_answered" }] },
    });
    expect(isFieldVisible(target, { has_company: "" })).toBe(false);
    expect(isFieldVisible(target, { has_company: "yes" })).toBe(true);
  });

  it("compares numbers numerically and strings case-insensitively", () => {
    const target = field({
      id: "note",
      type: "short_text",
      logic: { visibleWhen: [{ fieldId: "quantity", operator: "greater_than", value: "10" }] },
    });
    expect(isFieldVisible(target, { quantity: 5 })).toBe(false);
    expect(isFieldVisible(target, { quantity: 50 })).toBe(true);

    const textTarget = field({
      id: "note",
      type: "short_text",
      logic: { visibleWhen: [{ fieldId: "status", operator: "equals", value: "EMPLOYEE" }] },
    });
    expect(isFieldVisible(textTarget, { status: "employee" })).toBe(true);
  });
});

describe("conditional required", () => {
  it("is required when the rule matches, optional otherwise", () => {
    const target = companySchema.fields[2];
    expect(isFieldRequired(target, { has_company: "yes" })).toBe(true);
    expect(isFieldRequired(target, { has_company: "no" })).toBe(false);
    expect(isFieldRequired(target, {})).toBe(false);
  });
});

describe("validateFormValues", () => {
  it("passes a valid answer set", () => {
    const result = validateFormValues({
      schema: schema([field({ id: "quantity", type: "number", required: true })]),
      values: { quantity: "5" },
    });
    expect(result.valid).toBe(true);
    expect(result.values).toEqual({ quantity: 5 });
  });

  it("reports required fields in schema order", () => {
    const result = validateFormValues({
      schema: schema([
        field({ id: "name", type: "short_text", required: true }),
        field({ id: "email", type: "email", required: true }),
      ]),
      values: {},
    });
    expect(result.valid).toBe(false);
    expect(result.invalidFieldIds).toEqual(["name", "email"]);
    expect(result.errors.name).toBe("This field is required.");
  });

  it("validates email format", () => {
    const result = validateFormValues({
      schema: schema([field({ id: "email", type: "email", required: true })]),
      values: { email: "not-an-email" },
    });
    expect(result.errors.email).toBe("Enter a valid email address.");
  });

  it("enforces numeric bounds and integers", () => {
    const result = validateFormValues({
      schema: schema([
        field({ id: "quantity", type: "number", validation: { min: 1, max: 10, integer: true } }),
      ]),
      values: { quantity: "12" },
    });
    expect(result.errors.quantity).toBe("Value must be 10 or less.");

    const fraction = validateFormValues({
      schema: schema([
        field({ id: "quantity", type: "number", validation: { min: 1, max: 10, integer: true } }),
      ]),
      values: { quantity: "1.5" },
    });
    expect(fraction.errors.quantity).toBe("Enter a whole number.");
  });

  it("enforces string length and pattern", () => {
    const short = validateFormValues({
      schema: schema([field({ id: "code", type: "short_text", validation: { minLength: 3 } })]),
      values: { code: "ab" },
    });
    expect(short.errors.code).toBe("Use at least 3 characters.");

    const pattern = validateFormValues({
      schema: schema([field({ id: "code", type: "short_text", validation: { pattern: "^[A-Z]{3}$" } })]),
      values: { code: "abc" },
    });
    expect(pattern.errors.code).toBe("Value does not match the required format.");
  });

  it("keeps choice values inside the configured options", () => {
    const options = { options: [{ value: "yes", label: "Yes" }] };
    const result = validateFormValues({
      schema: schema([
        field({ id: "has_company", type: "multiple_choice", config: options, required: true }),
        field({
          id: "features",
          type: "checkbox",
          config: { options: [{ value: "a", label: "A" }] },
        }),
      ]),
      values: { has_company: "maybe", features: ["a", "z"] },
    });
    expect(result.errors.has_company).toBe("Select one of the available options.");
    expect(result.errors.features).toBe("Select one of the available options.");
  });

  it("rejects impossible dates", () => {
    const result = validateFormValues({
      schema: schema([field({ id: "due", type: "date", required: true })]),
      values: { due: "2026-02-30" },
    });
    expect(result.errors.due).toBe("Select a valid date.");
  });

  it("keeps linear scale answers inside the scale", () => {
    const result = validateFormValues({
      schema: schema([
        field({ id: "score", type: "linear_scale", config: { scaleMin: 1, scaleMax: 5 } }),
      ]),
      values: { score: "9" },
    });
    expect(result.errors.score).toBe("Choose a value between 1 and 5.");
  });

  it("skips hidden fields and strips their stored values", () => {
    const result = validateFormValues({
      schema: companySchema,
      values: { has_company: "no", company_name: "", company_npwp: "123" },
    });
    expect(result.valid).toBe(true);
    expect(result.values).toEqual({ has_company: "no" });
  });

  it("enforces conditional required once the condition matches", () => {
    const result = validateFormValues({
      schema: companySchema,
      values: { has_company: "yes" },
    });
    expect(result.valid).toBe(false);
    expect(result.invalidFieldIds).toEqual(["company_name", "company_npwp"]);
  });

  it("ignores calculation fields, which the engine owns", () => {
    const result = validateFormValues({
      schema: schema([
        field({ id: "quantity", type: "number", required: true }),
        field({ id: "subtotal", type: "calculation", formula: "quantity * 2", readOnly: true }),
      ]),
      values: { quantity: "5", subtotal: "not a number" },
    });
    expect(result.valid).toBe(true);
    expect(result.values).toEqual({ quantity: 5 });
  });
});

describe("pruneInvisibleValues", () => {
  it("removes values of fields hidden by conditional logic", () => {
    const values = pruneInvisibleValues(companySchema, {
      has_company: "no",
      company_npwp: "123",
    });
    expect(values).toEqual({ has_company: "no" });
  });
});

describe("schemaFieldOrder", () => {
  it("lists field ids in render order", () => {
    const order = schemaFieldOrder({
      ...emptyFormSchema,
      fields: [
        field({ id: "name", type: "short_text" }),
        field({ id: "section_1", type: "section", label: "Details" }),
        field({ id: "email", type: "email" }),
      ],
    });
    expect(order).toEqual(["name", "email"]);
  });
});
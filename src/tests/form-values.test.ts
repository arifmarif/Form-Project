import { describe, expect, it } from "vitest";
import {
  buildFormBlocks,
  coerceFieldValue,
  emptyFormSchema,
  formatFieldValue,
  initialFieldValues,
  isEmptyValue,
  normalizeFormValues,
  parseFormSchema,
  safeParseFormSchema,
  type FieldType,
  type FormField,
  type FormSchema,
  type FormSection,
} from "@/lib/form-schema";

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

function schema(fields: FormField[], sections: FormSection[] = []): FormSchema {
  return { ...emptyFormSchema, fields, sections };
}

describe("isEmptyValue", () => {
  it("treats blank strings, null and empty arrays as empty", () => {
    expect(isEmptyValue("")).toBe(true);
    expect(isEmptyValue("   ")).toBe(true);
    expect(isEmptyValue(null)).toBe(true);
    expect(isEmptyValue(undefined)).toBe(true);
    expect(isEmptyValue([])).toBe(true);
  });

  it("keeps zero and false as filled values", () => {
    expect(isEmptyValue(0)).toBe(false);
    expect(isEmptyValue(false)).toBe(false);
  });
});

describe("coerceFieldValue", () => {
  it("parses numeric strings, including comma decimals", () => {
    const quantity = field({ id: "quantity", type: "number" });
    expect(coerceFieldValue(quantity, "5")).toBe(5);
    expect(coerceFieldValue(quantity, "2.5")).toBe(2.5);
    expect(coerceFieldValue(quantity, "10,5")).toBe(10.5);
    expect(coerceFieldValue(quantity, "abc")).toBeNull();
    expect(coerceFieldValue(quantity, "")).toBeNull();
  });

  it("keeps zero", () => {
    expect(coerceFieldValue(field({ id: "quantity", type: "number" }), "0")).toBe(0);
  });

  it("normalises checkbox selections to string arrays", () => {
    const checkbox = field({
      id: "features",
      type: "checkbox",
      config: { options: [{ value: "a", label: "A" }, { value: "b", label: "B" }] },
    });
    expect(coerceFieldValue(checkbox, ["a"])).toEqual(["a"]);
    expect(coerceFieldValue(checkbox, "b")).toEqual(["b"]);
    expect(coerceFieldValue(checkbox, undefined)).toEqual([]);
  });
});

describe("normalizeFormValues", () => {
  it("drops unknown keys and empty values", () => {
    const result = normalizeFormValues(
      schema([
        field({ id: "quantity", type: "number" }),
        field({ id: "notes", type: "short_text" }),
      ]),
      { quantity: "3", notes: "   ", isAdmin: true },
    );
    expect(result).toEqual({ quantity: 3 });
  });

  it("seeds defaults for a fresh response", () => {
    const values = initialFieldValues(
      schema([field({ id: "quantity", type: "number", defaultValue: "2" })]),
    );
    expect(values).toEqual({ quantity: 2 });
  });
});

describe("buildFormBlocks", () => {
  it("groups fields under inline section dividers in builder order", () => {
    const blocks = buildFormBlocks(
      schema([
        field({ id: "name", type: "short_text" }),
        field({ id: "personal", type: "section", label: "Personal" }),
        field({ id: "email", type: "email" }),
        field({ id: "billing", type: "section", label: "Billing" }),
        field({ id: "total", type: "currency" }),
      ]),
    );

    expect(blocks.map((block) => block.title)).toEqual([null, "Personal", "Billing"]);
    expect(blocks[0].fields.map((entry) => entry.id)).toEqual(["name"]);
    expect(blocks[2].fields.map((entry) => entry.id)).toEqual(["total"]);
  });

  it("groups by declared sections using sectionId", () => {
    const blocks = buildFormBlocks(
      schema(
        [
          field({ id: "lead", type: "short_text" }),
          field({ id: "quantity", type: "number", sectionId: "products" }),
          field({ id: "subtotal", type: "calculation", sectionId: "totals" }),
        ],
        [
          { id: "products", label: "products", title: "Products" },
          { id: "totals", label: "totals", title: "Calculation" },
        ],
      ),
    );

    expect(blocks.map((block) => block.title)).toEqual([null, "Products", "Calculation"]);
    expect(blocks[1].fields.map((entry) => entry.id)).toEqual(["quantity"]);
  });

  it("returns a single implicit block when there are no sections", () => {
    const blocks = buildFormBlocks(
      schema([field({ id: "name", type: "short_text" }), field({ id: "email", type: "email" })]),
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].title).toBeNull();
    expect(blocks[0].fields).toHaveLength(2);
  });
});

describe("formatFieldValue", () => {
  it("formats currency using the field currency", () => {
    expect(
      formatFieldValue(field({ id: "total", type: "currency", config: { currency: "IDR" } }), 100000),
    ).toContain("100.000");
  });

  it("formats percentages and numbers", () => {
    expect(formatFieldValue(field({ id: "tax", type: "percentage" }), 11)).toBe("11%");
    expect(formatFieldValue(field({ id: "quantity", type: "number" }), 5000)).toBe("5,000");
  });

  it("maps checkbox values to option labels", () => {
    const checkbox = field({
      id: "features",
      type: "checkbox",
      config: { options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] },
    });
    expect(formatFieldValue(checkbox, ["a", "b"])).toBe("Alpha, Beta");
  });

  it("shows a placeholder for empty values", () => {
    expect(formatFieldValue(field({ id: "notes", type: "short_text" }), null)).toBe("—");
  });
});

describe("parseFormSchema", () => {
  it("fills defaults for a sparse stored schema", () => {
    const parsed = parseFormSchema({ fields: [], sections: null }, emptyFormSchema);
    expect(parsed?.settings.submitButtonText).toBe("Submit");
    expect(parsed?.sections).toEqual([]);
  });

  it("rejects a schema with duplicate field ids", () => {
    const duplicate = field({ id: "total", type: "number" });
    expect(safeParseFormSchema({ fields: [duplicate, duplicate] })).toBeNull();
  });

  it("rejects a field pointing at an unknown section", () => {
    const parsed = safeParseFormSchema({
      fields: [field({ id: "total", type: "number", sectionId: "ghost" })],
      sections: [],
    });
    expect(parsed).toBeNull();
  });
});
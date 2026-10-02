import { describe, expect, it } from "vitest";
import {
  DATA_TYPES,
  FIELD_TYPES,
  collectFieldIds,
  deriveFieldId,
  emptyFormSchema,
  fieldIdSchema,
  formSchemaSchema,
  slugify,
} from "@/lib/form-schema";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Customer Registration")).toBe("customer-registration");
  });

  it("strips diacritics and punctuation", () => {
    expect(slugify("Order Form (2026)")).toBe("order-form-2026");
    expect(slugify("Café Reservasi")).toBe("cafe-reservasi");
  });

  it("returns empty string for non-alphanumeric input", () => {
    expect(slugify("***")).toBe("");
  });
});

describe("fieldIdSchema", () => {
  it("accepts snake_case identifiers", () => {
    expect(fieldIdSchema.safeParse("unit_price").success).toBe(true);
    expect(fieldIdSchema.safeParse("quantity2").success).toBe(true);
  });

  it("rejects leading digits, dashes and uppercase", () => {
    expect(fieldIdSchema.safeParse("2quantity").success).toBe(false);
    expect(fieldIdSchema.safeParse("unit-price").success).toBe(false);
    expect(fieldIdSchema.safeParse("UnitPrice").success).toBe(false);
  });
});

describe("deriveFieldId", () => {
  it("derives an id from the label", () => {
    expect(deriveFieldId("Unit Price")).toBe("unit_price");
  });

  it("falls back when the label yields no usable characters", () => {
    expect(deriveFieldId("123")).toBe("field_123");
  });

  it("avoids collisions with taken ids", () => {
    expect(deriveFieldId("Quantity", ["quantity"])).toBe("quantity_2");
    expect(deriveFieldId("Quantity", ["quantity", "quantity_2"])).toBe("quantity_3");
  });
});

describe("formSchemaSchema", () => {
  it("accepts the empty schema", () => {
    expect(formSchemaSchema.safeParse(emptyFormSchema).success).toBe(true);
  });

  it("requires options for choice fields", () => {
    const result = formSchemaSchema.safeParse({
      ...emptyFormSchema,
      fields: [
        {
          id: "product",
          type: "dropdown",
          label: "Product",
          required: false,
          readOnly: false,
          config: {},
          validation: {},
          logic: {},
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("requires a formula for calculation fields", () => {
    const result = formSchemaSchema.safeParse({
      ...emptyFormSchema,
      fields: [
        {
          id: "subtotal",
          type: "calculation",
          label: "Subtotal",
          required: false,
          readOnly: true,
          config: {},
          validation: {},
          logic: {},
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate field ids", () => {
    const field = {
      id: "total",
      type: "number",
      label: "Total",
      required: false,
      readOnly: false,
      config: {},
      validation: {},
      logic: {},
    };
    const result = formSchemaSchema.safeParse({ ...emptyFormSchema, fields: [field, field] });
    expect(result.success).toBe(false);
  });

  it("accepts a calculation field with a formula", () => {
    const result = formSchemaSchema.safeParse({
      ...emptyFormSchema,
      fields: [
        {
          id: "subtotal",
          type: "calculation",
          label: "Subtotal",
          formula: "quantity * unit_price",
          required: false,
          readOnly: true,
          config: {},
          validation: {},
          logic: {},
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("field type catalog", () => {
  it("covers every MVP field type from the PRD", () => {
    expect(FIELD_TYPES).toHaveLength(18);
    expect(FIELD_TYPES).toContain("calculation");
    expect(DATA_TYPES).toContain("currency");
  });

  it("collects ids from fields and sections", () => {
    const ids = collectFieldIds({
      fields: [
        {
          id: "quantity",
          type: "number",
          label: "Quantity",
          required: false,
          readOnly: false,
          config: {},
          validation: {},
          logic: {},
        },
      ],
      sections: [{ id: "section_1", label: "s1", title: "Section 1" }],
    });
    expect([...ids].sort()).toEqual(["quantity", "section_1"]);
  });
});

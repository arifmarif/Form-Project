import type { FormField, FormSchema, FormSection } from "./schema";

/**
 * Flattens a schema into renderable blocks. Groups are the unit the renderer
 * iterates; `title === null` means an implicit group without a heading.
 */

export type FormBlock = {
  id: string;
  title: string | null;
  description?: string;
  fields: FormField[];
};

function isDivider(field: FormField): boolean {
  return field.type === "section";
}

function blockFrom(section: FormSection | null, id: string, fields: FormField[]): FormBlock {
  return {
    id,
    title: section?.title ?? section?.label ?? null,
    description: section?.description,
    fields,
  };
}

/** An inline `section` field becomes a divider block titled with its own label. */
function blockFromDivider(divider: FormField): FormBlock {
  return {
    id: divider.id,
    title: divider.label,
    description: divider.description,
    fields: [],
  };
}

/**
 * Sections exist in two shapes: inline `section` fields (what the builder
 * creates today, order follows the field list) and declared `schema.sections`
 * with fields pointing at them via `sectionId`. Inline dividers win when both
 * are present so the builder order is never second-guessed.
 */
export function buildFormBlocks(schema: Pick<FormSchema, "fields" | "sections">): FormBlock[] {
  const blocks: FormBlock[] = [];

  const inlineDividers = schema.fields.filter(isDivider);

  if (inlineDividers.length > 0) {
    let current: FormBlock = { id: "leading", title: null, fields: [] };
    for (const field of schema.fields) {
      if (!isDivider(field)) {
        current.fields.push(field);
        continue;
      }
      if (current.fields.length > 0) blocks.push(current);
      current = blockFromDivider(field);
    }
    if (current.fields.length > 0) blocks.push(current);
    return blocks;
  }

  if (schema.sections.length > 0) {
    const leading: FormField[] = [];
    const bySection = new Map<string, FormField[]>();
    for (const field of schema.fields) {
      if (field.sectionId) {
        const bucket = bySection.get(field.sectionId) ?? [];
        bucket.push(field);
        bySection.set(field.sectionId, bucket);
      } else {
        leading.push(field);
      }
    }

    if (leading.length > 0) blocks.push(blockFrom(null, "leading", leading));
    for (const section of schema.sections) {
      const fields = bySection.get(section.id) ?? [];
      if (fields.length > 0) blocks.push(blockFrom(section, section.id, fields));
    }
    return blocks;
  }

  const fields = schema.fields.filter((field) => !isDivider(field));
  if (fields.length > 0) blocks.push(blockFrom(null, "default", fields));
  return blocks;
}

/** Field lookup for the whole schema. */
export function indexFields(schema: Pick<FormSchema, "fields">): Map<string, FormField> {
  return new Map(schema.fields.map((field) => [field.id, field]));
}
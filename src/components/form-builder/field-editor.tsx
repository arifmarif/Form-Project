"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { FIELD_TYPES, type FieldType, type FormField, type FormSchema } from "@/lib/form-schema";
import {
  FIELD_TYPE_META,
  collectFieldIds,
  emptyFormSchema,
  formSchemaSchema,
  safeParseFormSchema,
  deriveFieldId,
} from "@/lib/form-schema";
import { saveSchemaAction } from "@/server/actions/form-actions";
import { cn } from "@/lib/utils";

export function FieldEditor({ formId, initialSchema }: { formId: string; initialSchema: unknown }) {
  const stored = useMemo(() => safeParseFormSchema(initialSchema) ?? emptyFormSchema, [initialSchema]);
  // Declared sections are preserved verbatim; editing them is Milestone 3 work.
  const { sections } = stored;
  const [fields, setFields] = useState<FormField[]>(stored.fields);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => fields.find((field) => field.id === selectedId) ?? null,
    [fields, selectedId],
  );

  const addField = useCallback(
    (type: FieldType) => {
      setFields((current) => {
        const meta = FIELD_TYPE_META[type];
        const id = deriveFieldId(meta.label, collectFieldIds({ fields: current, sections }));
        const field: FormField = {
          id,
          type,
          label: meta.label,
          required: false,
          readOnly: meta.readOnly,
          config:
            type === "dropdown" || type === "multiple_choice" || type === "checkbox"
              ? { options: [{ value: "option_1", label: "Option 1" }] }
              : {},
          validation: {},
          logic: {},
          ...(type === "calculation" ? { formula: "" } : {}),
        };
        setSelectedId(id);
        return [...current, field];
      });
      setMessage(null);
    },
    [sections],
  );

  const updateField = useCallback((id: string, patch: Partial<FormField>) => {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    );
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((current) => current.filter((field) => field.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }, []);

  const moveField = useCallback((id: string, direction: -1 | 1) => {
    setFields((current) => {
      const index = current.findIndex((field) => field.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }, []);

  const save = useCallback(() => {
    const candidate: FormSchema = {
      ...emptyFormSchema,
      fields,
      sections,
    };
    const parsed = formSchemaSchema.safeParse(candidate);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "The form structure is invalid.");
      setMessage(null);
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("formId", formId);
    formData.set("schema", JSON.stringify(parsed.data));

    startTransition(async () => {
      const result = await saveSchemaAction({ status: "idle" }, formData);
      if (result.status === "success") setMessage(result.message ?? "Saved.");
      else setError(result.message ?? "Unable to save the form.");
    });
  }, [fields, formId, sections]);

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div>
        <Label htmlFor="field-type">Add a field</Label>
        <Select
          id="field-type"
          value=""
          onChange={(event) => {
            if (event.target.value) addField(event.target.value as FieldType);
          }}
        >
          <option value="" disabled>
            Choose a type…
          </option>
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {FIELD_TYPE_META[type].label}
            </option>
          ))}
        </Select>

        <ul className="mt-4 space-y-2">
          {fields.length === 0 ? (
            <li className="rounded-md border border-dashed border-neutral-300 p-4 text-sm text-neutral-600">
              No fields yet. Choose a type to add your first field.
            </li>
          ) : (
            fields.map((field, index) => (
              <li key={field.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(field.id)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors",
                    selectedId === field.id
                      ? "border-indigo-400 bg-indigo-50"
                      : "border-neutral-200 bg-white hover:bg-neutral-50",
                  )}
                >
                  <span className="block font-medium text-neutral-900">{field.label}</span>
                  <span className="mt-0.5 block font-mono text-xs text-neutral-500">{field.id}</span>
                  <span className="sr-only">{`Position ${index + 1}`}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div>
        {selected ? (
          <FieldProperties
            field={selected}
            onChange={(patch) => updateField(selected.id, patch)}
            onRemove={() => removeField(selected.id)}
            onMove={(direction) => moveField(selected.id, direction)}
          />
        ) : (
          <p className="rounded-md border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">
            Select a field on the left to configure it.
          </p>
        )}

        <div className="mt-6 flex items-center gap-3 border-t border-neutral-200 pt-4">
          <Button type="button" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save fields"}
          </Button>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FieldProperties({
  field,
  onChange,
  onRemove,
  onMove,
}: {
  field: FormField;
  onChange: (patch: Partial<FormField>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const hasOptions =
    field.type === "dropdown" || field.type === "multiple_choice" || field.type === "checkbox";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="prop-label">Label</Label>
          <Input
            id="prop-label"
            value={field.label}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="prop-id">Field ID</Label>
          <Input
            id="prop-id"
            value={field.id}
            onChange={(event) => onChange({ id: event.target.value })}
          />
          <p className="mt-1 text-xs text-neutral-500">Used in formulas, e.g. quantity * price</p>
        </div>
      </div>

      <div>
        <Label htmlFor="prop-description">Description</Label>
        <Input
          id="prop-description"
          value={field.description ?? ""}
          onChange={(event) => onChange({ description: event.target.value || undefined })}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={field.required}
            onChange={(event) => onChange({ required: event.target.checked })}
          />
          Required
        </label>
        {field.type === "calculation" ? (
          <span className="text-sm text-neutral-600">Always read-only and recalculated.</span>
        ) : null}
      </div>

      {field.type === "calculation" ? (
        <div>
          <Label htmlFor="prop-formula">Formula</Label>
          <Input
            id="prop-formula"
            value={field.formula ?? ""}
            onChange={(event) => onChange({ formula: event.target.value })}
            placeholder="quantity * price"
            className="font-mono"
          />
        </div>
      ) : null}

      {hasOptions ? (
        <div>
          <Label htmlFor="prop-options">Options (one per line, `value | label`)</Label>
          <textarea
            id="prop-options"
            rows={4}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm"
            value={(field.config.options ?? [])
              .map((option) => `${option.value} | ${option.label}`)
              .join("\n")}
            onChange={(event) => {
              const options = event.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [value, label] = line.split("|").map((part) => part.trim());
                  return { value: value ?? "", label: label || value || "" };
                });
              onChange({ config: { ...field.config, options } });
            }}
          />
        </div>
      ) : null}

      <div className="flex items-center gap-2 border-t border-neutral-200 pt-4">
        <Button type="button" variant="secondary" size="sm" onClick={() => onMove(-1)}>
          Move up
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => onMove(1)}>
          Move down
        </Button>
        <Button type="button" variant="danger" size="sm" onClick={onRemove} className="ml-auto">
          Delete field
        </Button>
      </div>
    </div>
  );
}

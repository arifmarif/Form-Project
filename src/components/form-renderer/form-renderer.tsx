"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldInput } from "@/components/form-renderer/field-input";
import { FormBanner } from "@/components/ui/input";
import {
  buildFormBlocks,
  coerceFieldValue,
  initialFieldValues,
  isFieldRequired,
  isFieldVisible,
  isGroupFieldType,
  normalizeFormValues,
  type FormField,
  type FormSchema,
  type FormValues,
} from "@/lib/form-schema";
import { validateFieldValue, validateFormValues } from "@/lib/validation";
import { cn } from "@/lib/utils";

/**
 * The single form renderer (PRD §18). Preview, public forms and response
 * editing all use this component with a different `mode` — there is no second
 * implementation of the form UI.
 */

export type FormRendererMode = "preview" | "public" | "edit-response";

export type FormRendererProps = {
  schema: FormSchema;
  mode: FormRendererMode;
  title?: string;
  description?: string;
  initialValues?: FormValues;
  submitLabel?: string;
  disabled?: boolean;
  onValuesChange?: (values: FormValues) => void;
  onSubmit?: (values: FormValues) => void | Promise<void>;
};

type Status = "idle" | "submitting" | "done";

export function FormRenderer({
  schema,
  mode,
  title,
  description,
  initialValues,
  submitLabel,
  disabled = false,
  onValuesChange,
  onSubmit,
}: FormRendererProps) {
  const [values, setValues] = useState<FormValues>(() =>
    normalizeFormValues(schema, { ...initialFieldValues(schema), ...(initialValues ?? {}) }),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<string[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [failure, setFailure] = useState<string | null>(null);

  const blocks = useMemo(() => buildFormBlocks(schema), [schema]);

  const visibleFields = useMemo(
    () => blocks.flatMap((block) => block.fields).filter((field) => isFieldVisible(field, values)),
    [blocks, values],
  );

  const visibleIds = useMemo(
    () => new Set(visibleFields.map((field) => field.id)),
    [visibleFields],
  );

  const applyValues = useCallback(
    (next: FormValues) => {
      setValues(next);
      onValuesChange?.(next);
    },
    [onValuesChange],
  );

  const handleChange = useCallback(
    (field: FormField, raw: unknown) => {
      const next = { ...values, [field.id]: coerceFieldValue(field, raw) };
      setValues(next);
      onValuesChange?.(next);
      if (attempted) {
        const result = validateFormValues({ schema, values: next });
        setErrors(result.errors);
      } else if (errors[field.id]) {
        setErrors((current) => {
          const message = validateFieldValue(field, next[field.id], next);
          if (message) return current;
          const { ...rest } = current;
          delete rest[field.id];
          return rest;
        });
      }
    },
    [attempted, errors, onValuesChange, schema, values],
  );

  const handleBlur = useCallback(
    (field: FormField) => {
      setTouched((current) => (current.includes(field.id) ? current : [...current, field.id]));
      setErrors((current) => {
        const message = validateFieldValue(field, values[field.id], values);
        if (message) return { ...current, [field.id]: message };
        const { ...rest } = current;
        delete rest[field.id];
        return rest;
      });
    },
    [values],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAttempted(true);
      setFailure(null);

      const result = validateFormValues({ schema, values });
      setErrors(result.errors);

      if (!result.valid) {
        setStatus("idle");
        const first = result.invalidFieldIds[0];
        if (first) document.getElementById(first)?.focus();
        return;
      }

      applyValues(result.values);

      if (!onSubmit) {
        setStatus("done");
        return;
      }

      setStatus("submitting");
      try {
        await onSubmit(result.values);
        setStatus("done");
      } catch {
        setStatus("idle");
        setFailure("Unable to submit the form. Please try again.");
      }
    },
    [applyValues, onSubmit, schema, values],
  );

  const theme = schema.theme;

  return (
    <div
      style={{ "--form-primary": theme.primaryColor } as React.CSSProperties}
      className={cn(
        "rounded-lg border border-neutral-200 bg-white",
        theme.fontFamily === "serif" && "font-serif",
        theme.fontFamily === "mono" && "font-mono",
        theme.radius === "none" && "rounded-none",
        theme.radius === "sm" && "rounded-sm",
        theme.radius === "lg" && "rounded-xl",
      )}
    >
      <div className="space-y-8 p-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {title ?? "Untitled form"}
          </h1>
          {description ? <p className="text-sm text-neutral-600">{description}</p> : null}
        </header>

        {mode === "preview" ? (
          <FormBanner tone="info">
            Preview mode: validation, conditional logic and calculations run, but nothing is stored.
          </FormBanner>
        ) : null}

        <form onSubmit={handleSubmit} noValidate className="space-y-8">
          {blocks.length === 0 ? (
            <p className="rounded-md border border-dashed border-neutral-300 p-6 text-sm text-neutral-600">
              This form has no fields yet.
            </p>
          ) : null}

          {blocks.map((block) => (
            <section key={block.id} className="space-y-4">
              {block.title ? (
                <div className="border-b border-neutral-100 pb-2">
                  <h2 className="text-lg font-semibold text-neutral-900">{block.title}</h2>
                  {block.description ? (
                    <p className="text-sm text-neutral-600">{block.description}</p>
                  ) : null}
                </div>
              ) : null}

              {block.fields.map((field) => {
                const required = isFieldRequired(field, values);
                const message = errors[field.id];

                if (!visibleIds.has(field.id)) return null;

                return (
                  <FieldRow
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    required={required}
                    disabled={disabled || status === "submitting"}
                    error={touched.includes(field.id) || attempted ? message : undefined}
                    onChange={(raw) => handleChange(field, raw)}
                    onBlur={() => handleBlur(field)}
                  />
                );
              })}
            </section>
          ))}

          {failure ? <FormBanner tone="error">{failure}</FormBanner> : null}

          {status === "done" ? (
            <FormBanner tone="success">{schema.settings.confirmationMessage}</FormBanner>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="submit"
              disabled={disabled || status === "submitting"}
              style={{ backgroundColor: theme.primaryColor }}
            >
              {status === "submitting"
                ? "Submitting…"
                : (submitLabel ?? schema.settings.submitButtonText)}
            </Button>
            {status === "done" && onSubmit ? (
              <button
                type="button"
                onClick={() => {
                  setStatus("idle");
                  setAttempted(false);
                  applyValues(normalizeFormValues(schema, { ...initialFieldValues(schema), ...(initialValues ?? {}) }));
                }}
                className="text-sm text-neutral-600 underline-offset-2 hover:underline"
              >
                Submit another response
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function FieldRow({
  field,
  value,
  required,
  disabled,
  error,
  onChange,
  onBlur,
}: {
  field: FormField;
  value: unknown;
  required: boolean;
  disabled: boolean;
  error?: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}) {
  const errorId = `${field.id}-error`;
  const helpId = `${field.id}-help`;
  const describedBy =
    [field.helpText ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const input = (
    <FieldInput
      field={field}
      value={value}
      disabled={disabled}
      invalid={Boolean(error)}
      describedBy={describedBy}
      onChange={onChange}
      onBlur={onBlur}
    />
  );

  const common = (
    <div className="space-y-1.5" data-field-id={field.id}>
      {field.description ? <p className="text-sm text-neutral-600">{field.description}</p> : null}
      {input}
      {field.helpText ? (
        <p id={helpId} className="text-xs text-neutral-500">
          {field.helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );

  if (isGroupFieldType(field.type)) {
    return (
      <fieldset id={field.id} tabIndex={-1} className="space-y-2 focus:outline-none">
        <legend className="mb-1.5 text-sm font-medium text-neutral-800">
          {field.label}
          {required ? (
            <span aria-hidden="true" className="ml-0.5 text-red-600">
              *
            </span>
          ) : null}
        </legend>
        {common}
      </fieldset>
    );
  }

  return (
    <div className="space-y-1.5" data-field-id={field.id}>
      <label htmlFor={field.id} className="block text-sm font-medium text-neutral-800">
        {field.label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-red-600">
            *
          </span>
        ) : null}
      </label>
      {field.description ? <p className="text-sm text-neutral-600">{field.description}</p> : null}
      {input}
      {field.helpText ? (
        <p id={helpId} className="text-xs text-neutral-500">
          {field.helpText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
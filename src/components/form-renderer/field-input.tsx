"use client";

import { Input, Select, Textarea } from "@/components/ui/input";
import {
  CURRENCY_SYMBOLS,
  fieldCurrency,
  formatFieldValue,
  isGroupFieldType,
  isNumericFieldType,
  type FieldConfig,
  type FormField,
} from "@/lib/form-schema";
import { cn } from "@/lib/utils";

/**
 * One input per field type. Presentation only: values go in and out through
 * `onChange` so the renderer stays the single source of form state.
 */

export type FieldInputProps = {
  field: FormField;
  value: unknown;
  disabled: boolean;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
};

const TEXT_INPUT_TYPES: Partial<Record<FormField["type"], string>> = {
  date: "date",
  time: "time",
  datetime: "datetime-local",
};

export function FieldInput({
  field,
  value,
  disabled,
  invalid,
  describedBy,
  onChange,
  onBlur,
}: FieldInputProps) {
  const common = {
    id: field.id,
    name: field.id,
    disabled,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    onBlur,
    placeholder: field.placeholder,
  };

  if (field.type === "long_text") {
    return (
      <Textarea
        {...common}
        rows={field.config.rows ?? 4}
        value={asString(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "dropdown") {
    return (
      <Select
        {...common}
        value={asString(value)}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select an option…</option>
        {(field.config.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    );
  }

  if (field.type === "hidden") {
    return (
      <Input
        {...common}
        readOnly
        value={asString(value)}
        className="bg-neutral-50 text-neutral-600"
        onChange={() => undefined}
      />
    );
  }

  if (field.type === "calculation") {
    return (
      <Input
        {...common}
        readOnly
        tabIndex={-1}
        value={formatFieldValue(field, value)}
        className="bg-indigo-50/60 font-semibold text-indigo-900 focus-visible:outline-[var(--form-primary)]"
        onChange={() => undefined}
      />
    );
  }

  if (field.type === "currency") {
    const currency = fieldCurrency(field.config);
    return (
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-sm text-neutral-500">
          {CURRENCY_SYMBOLS[currency]}
        </span>
        <Input
          {...common}
          type="number"
          step="any"
          inputMode="decimal"
          className="focus-visible:outline-[var(--form-primary)]"
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }

  if (field.type === "percentage") {
    return (
      <div className="flex items-center gap-2">
        <Input
          {...common}
          type="number"
          step="any"
          inputMode="decimal"
          className="focus-visible:outline-[var(--form-primary)]"
          value={asString(value)}
          onChange={(event) => onChange(event.target.value)}
        />
        <span aria-hidden="true" className="text-sm text-neutral-500">
          %
        </span>
      </div>
    );
  }

  if (isNumericFieldType(field.type)) {
    return (
      <Input
        {...common}
        type="number"
        step="any"
        inputMode="decimal"
        className="focus-visible:outline-[var(--form-primary)]"
        value={asString(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (isGroupFieldType(field.type)) {
    return (
      <ChoiceInput
        field={field}
        value={value}
        disabled={disabled}
        invalid={invalid}
        describedBy={describedBy}
        onChange={onChange}
        onBlur={onBlur}
      />
    );
  }

  const inputType = TEXT_INPUT_TYPES[field.type] ?? (field.type === "email" ? "email" : "text");

  return (
    <Input
      {...common}
      type={inputType}
      className="focus-visible:outline-[var(--form-primary)]"
      value={asString(value)}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function ChoiceInput({
  field,
  value,
  disabled,
  invalid,
  describedBy,
  onChange,
  onBlur,
}: FieldInputProps) {
  if (field.type === "checkbox") {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <div className="space-y-2" role="group" aria-describedby={describedBy}>
        {(field.config.options ?? []).map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800"
          >
            <input
              type="checkbox"
              name={field.id}
              value={option.value}
              disabled={disabled}
              checked={selected.includes(option.value)}
              onChange={() => {
                const next = selected.includes(option.value)
                  ? selected.filter((entry) => entry !== option.value)
                  : [...selected, option.value];
                onChange(next);
              }}
              onBlur={onBlur}
              className="size-4 rounded border-neutral-300 accent-[var(--form-primary)]"
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "rating" || field.type === "linear_scale") {
    return (
      <div
        role="radiogroup"
        aria-describedby={describedBy}
        className="flex flex-wrap gap-2"
        tabIndex={invalid ? -1 : undefined}
      >
        {scaleValues(field.config, field.type).map((option) => (
          <label
            key={option}
            className={cn(
              "flex size-9 cursor-pointer items-center justify-center rounded-md border text-sm font-medium",
              "focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-[var(--form-primary)]",
              Number(value) === option
                ? "border-transparent bg-[var(--form-primary)] text-white"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
              disabled && "pointer-events-none opacity-50",
            )}
          >
            <input
              type="radio"
              name={field.id}
              value={option}
              disabled={disabled}
              checked={Number(value) === option}
              onChange={() => onChange(option)}
              onBlur={onBlur}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-describedby={describedBy} className="space-y-2">
      {(field.config.options ?? []).map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800"
        >
          <input
            type="radio"
            name={field.id}
            value={option.value}
            disabled={disabled}
            checked={asString(value) === option.value}
            onChange={() => onChange(option.value)}
            onBlur={onBlur}
            className="size-4 accent-[var(--form-primary)]"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

function scaleValues(config: FieldConfig, type: "rating" | "linear_scale"): number[] {
  const min = config.scaleMin ?? 1;
  const max = type === "rating" ? (config.scaleMax ?? 5) : (config.scaleMax ?? 10);
  const step = config.scaleStep ?? 1;
  const values: number[] = [];
  for (let current = min; current <= max && values.length < 100; current += step) {
    values.push(Number(current.toFixed(4)));
  }
  return values;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.map(String).join(", ");
  return String(value);
}
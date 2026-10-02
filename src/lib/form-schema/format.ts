import { FIELD_TYPE_META } from "./field-types";
import { isEmptyValue } from "./values";
import type { FieldConfig, FieldType, FormField } from "./schema";

/**
 * Presentation only. Formatting never changes the stored numeric value
 * (PRD §35): `Rp 100.000` is the display of `100000`.
 */

export type CurrencyCode = "IDR" | "USD" | "EUR";

const CURRENCY_LOCALES: Record<CurrencyCode, string> = {
  IDR: "id-ID",
  USD: "en-US",
  EUR: "de-DE",
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  IDR: "Rp",
  USD: "$",
  EUR: "€",
};

export function fieldCurrency(config: FieldConfig): CurrencyCode {
  return config.currency ?? "IDR";
}

export function formatCurrency(value: number, currency: CurrencyCode = "IDR"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}%`;
}

export function formatNumberValue(value: number, maximumFractionDigits = 4): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(value);
}

export function formatDateValue(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    parsed,
  );
}

export function formatDateTimeValue(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

const EMPTY_DISPLAY = "—";

/** Human readable value for summaries, read-only fields and response views. */
export function formatFieldValue(field: FormField, value: unknown): string {
  if (isEmptyValue(value)) return EMPTY_DISPLAY;

  if (Array.isArray(value)) {
    const labels = value.map((entry) => {
      const option = field.config.options?.find((candidate) => candidate.value === entry);
      return option?.label ?? String(entry);
    });
    return labels.join(", ");
  }

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") return formatNumberByType(field.type, field.config, value);

  if (typeof value !== "string") return EMPTY_DISPLAY;

  return formatStringByType(field.type, value);
}

function formatNumberByType(type: FieldType, config: FieldConfig, value: number): string {
  switch (type) {
    case "currency":
      return formatCurrency(value, fieldCurrency(config));
    case "percentage":
      return formatPercentage(value);
    default:
      return formatNumberValue(value);
  }
}

function formatStringByType(type: FieldType, value: string): string {
  if (type === "date") return formatDateValue(value);
  if (type === "datetime") return formatDateTimeValue(value);
  return FIELD_TYPE_META[type].dataType === "string" ? value : value;
}
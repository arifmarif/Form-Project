import { isEmptyValue } from "./values";
import type { FieldCondition, FormField, FormValues } from "./schema";

/**
 * Conditional visibility and conditional required rules (PRD §20, §21).
 * Conditions are AND-ed inside a rule; an empty rule list always passes.
 */

function asComparable(value: unknown): string | number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : trimmed.toLowerCase();
  }
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
}

export function evaluateCondition(condition: FieldCondition, values: FormValues): boolean {
  const actual = values[condition.fieldId];

  switch (condition.operator) {
    case "is_answered":
      return !isEmptyValue(actual);
    case "is_not_answered":
      return isEmptyValue(actual);
  }

  if (isEmptyValue(actual)) return false;

  switch (condition.operator) {
    case "equals":
      return asComparable(actual) === asComparable(condition.value);
    case "not_equals":
      return asComparable(actual) !== asComparable(condition.value);
    case "contains":
      if (Array.isArray(actual)) return actual.includes(String(condition.value));
      return String(actual).toLowerCase().includes(String(condition.value ?? "").toLowerCase());
    case "not_contains":
      if (Array.isArray(actual)) return !actual.includes(String(condition.value));
      return !String(actual).toLowerCase().includes(String(condition.value ?? "").toLowerCase());
    case "greater_than": {
      const left = asNumber(actual);
      const right = asNumber(condition.value);
      return left !== null && right !== null && left > right;
    }
    case "less_than": {
      const left = asNumber(actual);
      const right = asNumber(condition.value);
      return left !== null && right !== null && left < right;
    }
  }
}

export function evaluateConditions(conditions: FieldCondition[] | undefined, values: FormValues): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((condition) => evaluateCondition(condition, values));
}

export function isFieldVisible(field: FormField, values: FormValues): boolean {
  return evaluateConditions(field.logic.visibleWhen, values);
}

export function isFieldRequired(field: FormField, values: FormValues): boolean {
  if (field.required) return true;
  return evaluateConditions(field.logic.requiredWhen, values);
}
import type { Prisma } from "@/generated/prisma/client";

/**
 * Narrows a domain object to Prisma's JSON input type. Prisma validates that the
 * value is JSON-serialisable at the driver boundary; this keeps callers from
 * needing `as` casts at every write site.
 */
export function toJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

import { isLikelyIsoDateTimeString } from "./is-likely-iso-datetime";

export function normalizeCreatedAt(createdAt: unknown): string | undefined {
  if (createdAt instanceof Date) {
    return Number.isNaN(createdAt.getTime())
      ? undefined
      : createdAt.toISOString();
  }

  if (typeof createdAt !== "string") {
    return undefined;
  }

  if (!isLikelyIsoDateTimeString(createdAt)) {
    return undefined;
  }

  const date = new Date(createdAt);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

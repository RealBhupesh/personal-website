import type { FieldSchema } from "./site-fields";
/** Recovery may be incomplete while someone is editing. Check structure, not publication constraints. */
export function recoverableSiteContent(
  value: unknown,
  schema: FieldSchema,
): boolean {
  if (schema.anyOf)
    return schema.anyOf.some((s) => recoverableSiteContent(value, s));
  if (schema.const !== undefined) return value === schema.const;
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      return false;
    const record = value as Record<string, unknown>;
    if ((schema.required ?? []).some((k) => record[k] === undefined))
      return false;
    return Object.entries(record).every(
      ([k, v]) =>
        !!schema.properties?.[k] &&
        recoverableSiteContent(v, schema.properties[k]),
    );
  }
  if (schema.type === "array")
    return (
      Array.isArray(value) &&
      value.length <= (schema.maxItems ?? 1000) &&
      value.every((v) => recoverableSiteContent(v, schema.items ?? {}))
    );
  if (schema.type === "boolean") return typeof value === "boolean";
  if (schema.type === "number" || schema.type === "integer")
    return typeof value === "number" && Number.isFinite(value);
  if (schema.type === "string")
    return typeof value === "string" && value.length <= 300000;
  return value === undefined;
}

import { z } from "zod";

const SUPPORTED_KEYWORDS = new Set([
  "$id",
  "$defs",
  "$ref",
  "$anchor",
  "type",
  "format",
  "title",
  "description",
  "enum",
  "items",
  "prefixItems",
  "minItems",
  "maxItems",
  "minimum",
  "maximum",
  "anyOf",
  "oneOf",
  "properties",
  "additionalProperties",
  "required",
  "propertyOrdering",
]);

const SCHEMA_MAP_KEYWORDS = new Set(["properties", "$defs"]);

export function pruneToSupportedKeywords(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(pruneToSupportedKeywords);
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  const result: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (!SUPPORTED_KEYWORDS.has(key)) {
      continue;
    }

    if (SCHEMA_MAP_KEYWORDS.has(key) && child && typeof child === "object") {
      const mapped: Record<string, unknown> = {};

      for (const [name, sub] of Object.entries(
        child as Record<string, unknown>,
      )) {
        mapped[name] = pruneToSupportedKeywords(sub);
      }

      result[key] = mapped;
      continue;
    }

    result[key] = pruneToSupportedKeywords(child);
  }

  return result;
}

export function toGeminiResponseSchema(schema: z.ZodType) {
  return pruneToSupportedKeywords(
    z.toJSONSchema(schema, { target: "draft-7", io: "output" }),
  );
}

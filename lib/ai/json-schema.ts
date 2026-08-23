import { z } from "zod";

const SUPPORTED_KEYWORDS = new Set([
  "type",
  "properties",
  "required",
  "additionalProperties",
  "items",
  "anyOf",
  "enum",
  "const",
  "description",
]);

const SCHEMA_MAP_KEYWORDS = new Set(["properties"]);

function prune(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(prune);
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(source)) {
    if (!SUPPORTED_KEYWORDS.has(key)) {
      continue;
    }

    if (SCHEMA_MAP_KEYWORDS.has(key) && child && typeof child === "object") {
      const mapped: Record<string, unknown> = {};

      for (const [name, sub] of Object.entries(
        child as Record<string, unknown>,
      )) {
        mapped[name] = prune(sub);
      }

      result[key] = mapped;
      continue;
    }

    result[key] = prune(child);
  }

  if (result.type === "object" && result.properties) {
    result.additionalProperties = false;
    result.required = Object.keys(result.properties as object);
  }

  return result;
}

export function toStrictJsonSchema(schema: z.ZodType) {
  return prune(
    z.toJSONSchema(schema, { target: "draft-2020-12", io: "output" }),
  ) as Record<string, unknown>;
}

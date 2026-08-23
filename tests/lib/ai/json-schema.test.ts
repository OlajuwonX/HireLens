import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toStrictJsonSchema } from "@/lib/ai/json-schema";
import { applicationIntelligenceSchema } from "@/lib/ai/schemas/application-intelligence.schema";
import { extractedJobSchema } from "@/lib/ai/schemas/job-extraction.schema";

type JsonSchema = Record<string, unknown>;

function walk(node: unknown, visit: (object: JsonSchema) => void) {
  if (Array.isArray(node)) {
    for (const entry of node) {
      walk(entry, visit);
    }

    return;
  }

  if (!node || typeof node !== "object") {
    return;
  }

  const schema = node as JsonSchema;

  if (schema.properties) {
    visit(schema);

    for (const child of Object.values(schema.properties as JsonSchema)) {
      walk(child, visit);
    }
  }

  if (schema.items) {
    walk(schema.items, visit);
  }

  if (Array.isArray(schema.anyOf)) {
    walk(schema.anyOf, visit);
  }
}

describe("toStrictJsonSchema", () => {
  it("marks every object closed and every property required", () => {
    const schema = toStrictJsonSchema(applicationIntelligenceSchema);
    const objects: JsonSchema[] = [];

    walk(schema, (object) => objects.push(object));

    expect(objects.length).toBeGreaterThan(5);

    for (const object of objects) {
      expect(object.additionalProperties).toBe(false);
      expect(object.required).toEqual(
        Object.keys(object.properties as JsonSchema),
      );
    }
  });

  it("drops keywords that strict structured outputs reject", () => {
    const serialized = JSON.stringify(
      toStrictJsonSchema(applicationIntelligenceSchema),
    );

    for (const keyword of [
      "$schema",
      "minLength",
      "maxLength",
      "minimum",
      "maximum",
      "minItems",
      "format",
    ]) {
      expect(serialized).not.toContain(`"${keyword}"`);
    }
  });

  it("keeps the shape the analysis result is validated against", () => {
    const schema = toStrictJsonSchema(applicationIntelligenceSchema);

    expect(Object.keys(schema.properties as JsonSchema).sort()).toEqual(
      Object.keys(applicationIntelligenceSchema.shape).sort(),
    );
  });

  it("keeps nullable fields expressible for job extraction", () => {
    const schema = toStrictJsonSchema(extractedJobSchema);
    const properties = schema.properties as JsonSchema;

    expect(properties.title).toMatchObject({
      anyOf: [{ type: "string" }, { type: "null" }],
    });
  });

  it("produces a schema small enough to send on every request", () => {
    expect(
      JSON.stringify(toStrictJsonSchema(applicationIntelligenceSchema)).length,
    ).toBeLessThan(20_000);
  });

  it("closes objects that zod left open", () => {
    const loose = z.looseObject({ name: z.string() });

    expect(toStrictJsonSchema(loose)).toMatchObject({
      additionalProperties: false,
      required: ["name"],
    });
  });
});

import { readFileSync } from "node:fs";
import { generatedDocuments } from "@/lib/db/schema";
import { describe, expect, it } from "vitest";

describe("reason document type", () => {
  it("is a document type the database accepts", () => {
    expect(generatedDocuments.type.enumValues).toContain("REASON_TO_JOIN");
  });

  it("is added by a migration that only extends the enum", () => {
    const journal = JSON.parse(
      readFileSync("drizzle/meta/_journal.json", "utf8"),
    ) as { entries: { tag: string }[] };
    const sql = journal.entries
      .map((entry) => readFileSync(`drizzle/${entry.tag}.sql`, "utf8"))
      .find((text) => text.includes("'REASON_TO_JOIN'"));

    expect(sql?.trim()).toBe(
      `ALTER TYPE "public"."document_type" ADD VALUE 'REASON_TO_JOIN';`,
    );
  });
});

import { readFileSync } from "node:fs";
import { aiViewLabels } from "@/features/analyses/server/analysis.mapper";
import {
  DOCUMENT_TYPES,
  documentTypeForView,
  documentTypeLabels,
} from "@/features/documents/constants";
import { matchingDocumentTypes } from "@/features/search/server/search.mapper";
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

describe("reason in the app", () => {
  it("is labelled Reason in the drawer and in AI Documents", () => {
    expect(aiViewLabels.REASON_TO_JOIN).toBe("Reason");
    expect(documentTypeLabels.REASON_TO_JOIN).toBe("Reason");
  });

  it("saves to its own document type", () => {
    expect(documentTypeForView.REASON_TO_JOIN).toBe("REASON_TO_JOIN");
    expect(DOCUMENT_TYPES).toContain("REASON_TO_JOIN");
  });

  it("can be found by searching for reason", () => {
    expect(
      matchingDocumentTypes("reason", generatedDocuments.type.enumValues),
    ).toEqual(["REASON_TO_JOIN"]);
  });
});

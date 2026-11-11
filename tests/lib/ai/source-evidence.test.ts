import { describe, expect, it } from "vitest";
import { extractSourceEvidence, formatSourceEvidence } from "@/lib/ai/source-evidence";
import { sourceText } from "../../fixtures/rev/frontend-engineer";

describe("extractSourceEvidence", () => {
  const items = extractSourceEvidence(sourceText);

  it("numbers statements with stable, padded ids", () => {
    expect(items[0].id).toBe("S-001");
    expect(items.map((item) => item.id)).toEqual(
      items.map((_, index) => `S-${String(index + 1).padStart(3, "0")}`),
    );
  });

  it("strips bullet markers and rejoins wrapped lines", () => {
    expect(items.map((item) => item.text)).toContain(
      "Built and maintained React and TypeScript interfaces for a payments dashboard used by merchants",
    );
  });

  it("skips headings and short fragments", () => {
    const texts = items.map((item) => item.text);

    expect(texts).not.toContain("EXPERIENCE");
    expect(texts).not.toContain("SKILLS");
    expect(texts).not.toContain("Ada Obi");
  });

  it("is deterministic, so ids stay stable between passes", () => {
    expect(extractSourceEvidence(sourceText)).toEqual(items);
  });

  it("drops duplicate statements", () => {
    const repeated = "• Built a design system for the team\n• Built a design system for the team";

    expect(extractSourceEvidence(repeated)).toHaveLength(1);
  });

  it("returns nothing for empty input", () => {
    expect(extractSourceEvidence(null)).toEqual([]);
    expect(extractSourceEvidence("   ")).toEqual([]);
  });

  it("caps the number of statements to bound prompt size", () => {
    const long = Array.from({ length: 200 }, (_, i) => `• Delivered feature number ${i} for clients`).join("\n");

    expect(extractSourceEvidence(long)).toHaveLength(80);
  });
});

describe("formatSourceEvidence", () => {
  it("wraps statements in a tagged block", () => {
    const block = formatSourceEvidence([{ id: "S-001", text: "Built things for users" }]);

    expect(block).toBe("<source_evidence>\nS-001: Built things for users\n</source_evidence>");
  });

  it("returns null when there is nothing to send", () => {
    expect(formatSourceEvidence([])).toBeNull();
  });
});

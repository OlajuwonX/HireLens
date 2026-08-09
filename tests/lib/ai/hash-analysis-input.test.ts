import { describe, expect, it } from "vitest";
import { hashAnalysisInput } from "@/lib/ai/hash-analysis-input";

describe("hashAnalysisInput", () => {
  it("returns a stable hash for identical input", async () => {
    const input = { type: "GENERAL", resumeVersionId: "a", promptVersion: "v2" };

    expect(await hashAnalysisInput(input)).toBe(await hashAnalysisInput(input));
  });

  it("changes when the prompt version changes", async () => {
    const first = await hashAnalysisInput({ promptVersion: "v1" });
    const second = await hashAnalysisInput({ promptVersion: "v2" });

    expect(first).not.toBe(second);
  });

  it("changes when the resume version changes", async () => {
    const first = await hashAnalysisInput({ resumeVersionId: "a" });
    const second = await hashAnalysisInput({ resumeVersionId: "b" });

    expect(first).not.toBe(second);
  });

  it("produces a 64 character hex digest", async () => {
    expect(await hashAnalysisInput({ any: "value" })).toMatch(/^[0-9a-f]{64}$/);
  });
});

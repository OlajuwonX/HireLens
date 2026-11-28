import { describe, expect, it } from "vitest";
import { checkCounts, checkRow, mergeRows, reasonFor } from "../src/shared/checklist";

const field = (label: string, overrides: Partial<{ kind: "text" | "textarea" | "radio" | "checkbox" | "file" | "select"; required: boolean }> = {}) => ({
  selector: `#${label.replace(/\W+/g, "-")}`,
  kind: overrides.kind ?? ("text" as const),
  label,
  required: overrides.required ?? false,
  options: [],
});

describe("checkRow", () => {
  it("credits whoever filled the field", () => {
    expect(checkRow({ field: field("Email"), filledBy: "profile", hadValue: false, hasValue: true }).status).toBe("profile");
    expect(checkRow({ field: field("Why us?"), filledBy: "ai", hadValue: false, hasValue: true }).status).toBe("ai");
  });

  it("tells required gaps from optional ones, with a reason", () => {
    const needed = checkRow({ field: field("Gender", { kind: "select", required: true }), filledBy: null, hadValue: false, hasValue: false });
    const optional = checkRow({ field: field("Headline"), filledBy: null, hadValue: false, hasValue: false });

    expect(needed).toMatchObject({ status: "needs-you", reason: "Personal question. HireLens leaves it to you." });
    expect(optional).toMatchObject({ status: "skipped", reason: "HireLens has no saved answer for this." });
  });

  it("marks fields the page or you had already filled", () => {
    expect(checkRow({ field: field("Phone", { required: true }), filledBy: null, hadValue: true, hasValue: true }).status).toBe("already");
  });

  it("names unlabelled fields", () => {
    expect(checkRow({ field: field(""), filledBy: null, hadValue: false, hasValue: false }).label).toBe("Unlabelled field");
  });
});

describe("reasons", () => {
  it("explains uploads, consent boxes and options", () => {
    expect(reasonFor(field("Portfolio", { kind: "file" }))).toBe("Upload this file yourself.");
    expect(reasonFor(field("Autofill from resume", { kind: "file" }))).toBe("Not needed. HireLens fills the form itself.");
    expect(reasonFor(field("I agree", { kind: "checkbox" }))).toBe("Confirm boxes like this yourself.");
    expect(reasonFor(field("Visa type", { kind: "radio" }))).toBe("None of your saved answers matched these options.");
  });
});

describe("counts and merging", () => {
  const rows = [
    { selector: "#a", label: "A", status: "profile" as const, reason: null },
    { selector: "#b", label: "B", status: "needs-you" as const, reason: "x" },
    { selector: "#c", label: "C", status: "skipped" as const, reason: "y" },
  ];

  it("counts done, needed and optional rows", () => {
    expect(checkCounts(rows)).toEqual({ done: 1, needsYou: 1, skipped: 1 });
  });

  it("keeps rows still on the page, drops gone ones and updates repeats", () => {
    const merged = mergeRows(rows, [{ selector: "#b", label: "B", status: "ai", reason: null }], (selector) => selector !== "#c");

    expect(merged.map((row) => [row.selector, row.status])).toEqual([
      ["#a", "profile"],
      ["#b", "ai"],
    ]);
  });
});

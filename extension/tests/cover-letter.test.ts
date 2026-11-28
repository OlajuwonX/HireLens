import { describe, expect, it } from "vitest";
import { asksForCoverLetter } from "../src/content/cover-letter";

const field = (label: string, kind: "text" | "textarea" | "file") => ({ selector: `#${kind}`, kind, label, required: false, options: [] });

describe("asksForCoverLetter", () => {
  it("spots cover letter boxes and uploads", () => {
    expect(asksForCoverLetter([field("Cover letter (Optional)", "textarea")])).toBe(true);
    expect(asksForCoverLetter([field("Cover Letter", "file")])).toBe(true);
  });

  it("ignores forms without one", () => {
    expect(asksForCoverLetter([field("First name", "text"), field("Resume", "file")])).toBe(false);
    expect(asksForCoverLetter([field("Cover letter link", "text")])).toBe(false);
  });
});

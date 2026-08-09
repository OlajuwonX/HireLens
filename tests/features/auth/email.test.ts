import { describe, expect, it } from "vitest";
import { normalizeEmail } from "@/features/auth/server/email";

describe("normalizeEmail", () => {
  it("lowercases so a Google profile links to a credentials account", () => {
    expect(normalizeEmail("Alice@Gmail.com")).toBe("alice@gmail.com");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeEmail("  alice@gmail.com  ")).toBe("alice@gmail.com");
  });

  it("is idempotent", () => {
    const once = normalizeEmail("Alice@Gmail.com");

    expect(normalizeEmail(once)).toBe(once);
  });

  it("produces the same key for every casing of one address", () => {
    const variants = [
      "alice@gmail.com",
      "ALICE@GMAIL.COM",
      "Alice@Gmail.Com",
      " aLiCe@gMaIl.cOm ",
    ];

    expect(new Set(variants.map(normalizeEmail)).size).toBe(1);
  });
});

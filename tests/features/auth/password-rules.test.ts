import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { passwordSchema } from "@/features/auth/schemas/credentials.schema";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_RULES,
  passwordProblemMessage,
  unmetPasswordRules,
} from "@/features/auth/schemas/password-rules";
import { describe, expect, it } from "vitest";

const VALID = "Str0ngPassword";

describe("unmetPasswordRules", () => {
  it("returns nothing for a password that meets every rule", () => {
    expect(unmetPasswordRules(VALID)).toEqual([]);
  });

  it("reports every missing rule at once, not just the first", () => {
    expect(unmetPasswordRules("abc").map((rule) => rule.id)).toEqual([
      "length",
      "uppercase",
      "number",
    ]);
  });

  it("names the one rule a nearly-valid password misses", () => {
    expect(unmetPasswordRules("password123").map((rule) => rule.id)).toEqual([
      "uppercase",
    ]);
  });

  it("counts a short password as short even when it has every character class", () => {
    expect(unmetPasswordRules("Ab1").map((rule) => rule.id)).toEqual([
      "length",
    ]);
  });
});

describe("the schema and the checklist never disagree", () => {
  it.each([
    "",
    "abc",
    "Ab1",
    "password123",
    "PASSWORD123",
    "Str0ngPassword",
    "aB3aB3aB3a",
  ])("agree on %j", (password) => {
    const missing = unmetPasswordRules(password);
    const parsed = passwordSchema.safeParse(password);

    expect(parsed.success).toBe(missing.length === 0);

    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.message)).toEqual(
        missing.map((rule) => rule.label),
      );
    }
  });

  it("still rejects a password past the length cap", () => {
    const parsed = passwordSchema.safeParse("Ab1".repeat(PASSWORD_MAX_LENGTH));

    expect(parsed.success).toBe(false);
  });
});

describe("passwordProblemMessage", () => {
  it("says nothing when the password is acceptable", () => {
    expect(passwordProblemMessage(VALID)).toBeNull();
  });

  it("lists a single missing rule", () => {
    expect(passwordProblemMessage("password123")).toBe(
      "Your password still needs an uppercase letter.",
    );
  });

  it("lists every missing rule in one sentence", () => {
    expect(passwordProblemMessage("abc")).toBe(
      "Your password still needs at least 10 characters, an uppercase letter and a number.",
    );
  });

  it("explains the length cap rather than the rules", () => {
    expect(passwordProblemMessage("Ab1".repeat(PASSWORD_MAX_LENGTH))).toBe(
      `Password is too long. Use at most ${PASSWORD_MAX_LENGTH} characters.`,
    );
  });

  it("never leaves a rejected password without a reason", () => {
    for (const password of ["", "a", "ABCDEFGHIJK", "1234567890"]) {
      expect(passwordProblemMessage(password)).not.toBeNull();
    }
  });
});

describe("the rules stay usable in a browser", () => {
  it("gives every rule a stable id and a label", () => {
    for (const rule of PASSWORD_RULES) {
      expect(rule.id).toMatch(/^[a-z]+$/);
      expect(rule.label.length).toBeGreaterThan(0);
    }
  });

  it("keeps the ids unique so they can key a list", () => {
    const ids = PASSWORD_RULES.map((rule) => rule.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("carries no validator, so the checklist never ships zod to the browser", () => {
    const source = readFileSync(
      "features/auth/schemas/password-rules.ts",
      "utf8",
    );

    expect(source).not.toContain("zod");
  });

  it("is the only rule source any auth client component reads", () => {
    const offenders = readdirSync("features/auth/components")
      .filter((entry) => entry.endsWith(".tsx"))
      .map((entry) => join("features/auth/components", entry))
      .filter((file) => {
        const source = readFileSync(file, "utf8");

        return (
          source.trimStart().startsWith('"use client"') &&
          source.includes("credentials.schema")
        );
      });

    expect(offenders).toEqual([]);
  });
});

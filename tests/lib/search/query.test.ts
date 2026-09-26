import { SEARCH_MAX_LENGTH, SEARCH_MIN_LENGTH } from "@/lib/search/constants";
import {
  escapeLike,
  likePattern,
  normalizeSearchQuery,
} from "@/lib/search/query";
import { describe, expect, it } from "vitest";

describe("normalizeSearchQuery", () => {
  it("trims and collapses internal whitespace", () => {
    expect(normalizeSearchQuery("  cover   letter \n")).toBe("cover letter");
  });

  it("returns null for null, undefined and blank input", () => {
    expect(normalizeSearchQuery(null)).toBeNull();
    expect(normalizeSearchQuery(undefined)).toBeNull();
    expect(normalizeSearchQuery("   ")).toBeNull();
  });

  it("returns null below the minimum length", () => {
    expect(normalizeSearchQuery("a".repeat(SEARCH_MIN_LENGTH - 1))).toBeNull();
    expect(normalizeSearchQuery("a".repeat(SEARCH_MIN_LENGTH))).not.toBeNull();
  });

  it("does not count padding towards the minimum length", () => {
    expect(normalizeSearchQuery("  a  ")).toBeNull();
  });

  it("caps over-long input at the maximum length", () => {
    const result = normalizeSearchQuery("x".repeat(SEARCH_MAX_LENGTH + 50));

    expect(result).toHaveLength(SEARCH_MAX_LENGTH);
  });

  it("keeps unicode and punctuation intact", () => {
    expect(normalizeSearchQuery("Ünïcode & co.")).toBe("Ünïcode & co.");
  });
});

describe("escapeLike", () => {
  it("escapes percent, underscore and backslash", () => {
    expect(escapeLike("50%")).toBe("50\\%");
    expect(escapeLike("a_b")).toBe("a\\_b");
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("escapes every occurrence", () => {
    expect(escapeLike("%%__")).toBe("\\%\\%\\_\\_");
  });

  it("leaves ordinary text untouched", () => {
    expect(escapeLike("software engineer")).toBe("software engineer");
  });
});

describe("likePattern", () => {
  it("wraps escaped input so wildcards typed by the user stay literal", () => {
    expect(likePattern("100%_done")).toBe("%100\\%\\_done%");
  });
});

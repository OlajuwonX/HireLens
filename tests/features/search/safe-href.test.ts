import { isSafeInternalHref } from "@/features/search/safe-href";
import { describe, expect, it } from "vitest";

describe("isSafeInternalHref", () => {
  it.each([
    "/dashboard",
    "/dashboard/jobs?open=123e4567-e89b-12d3-a456-426614174000",
    "/settings/account",
    "/admin/users",
  ])("accepts %s", (href) => {
    expect(isSafeInternalHref(href)).toBe(true);
  });

  it.each([
    "",
    "dashboard",
    "//evil.example.com",
    "///evil.example.com",
    "http://evil.example.com",
    "https://evil.example.com/dashboard",
    "javascript:alert(1)",
    "data:text/html,hi",
    "/\\evil.example.com",
    "/dash board",
    "/dash\nboard",
    "/dash\tboard",
    "/dash\u0000board",
    "/dash board",
    "\\\\evil",
  ])("rejects %j", (href) => {
    expect(isSafeInternalHref(href)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isSafeInternalHref(undefined)).toBe(false);
    expect(isSafeInternalHref(null)).toBe(false);
    expect(isSafeInternalHref(42)).toBe(false);
    expect(isSafeInternalHref({ href: "/x" })).toBe(false);
  });

  it("rejects absurdly long links", () => {
    expect(isSafeInternalHref(`/${"a".repeat(400)}`)).toBe(false);
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("impersonation guards are wired into every dangerous action", () => {
  it("password change checks isImpersonating", () => {
    const source = readFileSync(
      "features/auth/actions/password-actions.ts",
      "utf8",
    );
    expect(source).toContain("isImpersonating()");
  });

  it("account disable and deletion both check isImpersonating", () => {
    const source = readFileSync(
      "features/account/actions/account-actions.ts",
      "utf8",
    );
    const matches = source.match(/isImpersonating\(\)/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it("start and end impersonation both re-check requireAdminUser", () => {
    const source = readFileSync(
      "features/admin/actions/impersonation-actions.ts",
      "utf8",
    );
    const matches = source.match(/await requireAdminUser\(\)/g) ?? [];
    expect(matches.length).toBe(2);
  });

  it("starting impersonation refuses to start a second, nested session", () => {
    const source = readFileSync(
      "features/admin/actions/impersonation-actions.ts",
      "utf8",
    );
    expect(source).toContain("alreadyImpersonating");
  });

  it("requireAdminUser resolves the real user, never the impersonation target", () => {
    const source = readFileSync(
      "features/admin/server/require-admin.ts",
      "utf8",
    );
    expect(source).toContain("requireRealDatabaseUser");
    expect(source).not.toContain("await requireDatabaseUser()");
  });

  it("all four user-admin actions refuse to run while impersonating", () => {
    const source = readFileSync(
      "features/admin/actions/user-admin-actions.ts",
      "utf8",
    );
    const matches = source.match(/await assertNotImpersonating\(\)/g) ?? [];
    expect(matches.length).toBe(4);
  });

  it("starting impersonation never hands the raw claim to unstable_update — only an opaque session id the jwt callback re-validates against the database", () => {
    const source = readFileSync(
      "features/admin/actions/impersonation-actions.ts",
      "utf8",
    );
    expect(source).toContain("sessionPublicId: session.publicId");
    expect(source).not.toContain("actingAdminId: admin.id");
  });

  it("the jwt callback re-validates an update-triggered impersonation claim against the database rather than trusting the client payload", () => {
    const source = readFileSync("auth.ts", "utf8");
    expect(source).toContain("resolveImpersonationClaimForUpdate");
    expect(source).toContain("callerRealUserId: token.dbUserId");
  });
});

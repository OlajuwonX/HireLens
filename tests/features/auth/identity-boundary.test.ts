import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      return walk(full);
    }

    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const sources = ["app", "features", "components"].flatMap((root) => walk(root));

function isClientModule(file: string) {
  return readFileSync(file, "utf8").trimStart().startsWith('"use client"');
}

const clientModules = sources.filter(isClientModule);

describe("internal database ids never reach a client module", () => {
  it.each([
    ["analysisId", /\banalysisId\b/],
    ["resumeVersionId", /\bresumeVersionId\b/],
    ["fileAssetId", /\bfileAssetId\b/],
    ["applicationId", /\bapplicationId\b/],
  ])("no client module declares a raw %s prop", (_name, pattern) => {
    const offenders = clientModules.filter((file) => {
      const source = readFileSync(file, "utf8");

      return pattern.test(source) && !/PublicId\b/.test(source);
    });

    expect(offenders).toEqual([]);
  });

  it("the correction form posts a public id", () => {
    const source = readFileSync(
      "features/analyses/components/requirement-correction-form.tsx",
      "utf8",
    );

    expect(source).toContain('name="analysisPublicId"');
    expect(source).not.toContain('name="analysisId"');
  });
});

describe("the session carries only non-sensitive claims", () => {
  const auth = readFileSync("auth.ts", "utf8");

  it("exposes the database id to the server, not through session.user", () => {
    expect(auth).toContain("session.dbUserId");
    expect(auth).not.toContain("session.user.id =");
  });

  it("never puts a secret on the token", () => {
    for (const secret of [
      "passwordHash",
      "GEMINI_API_KEY",
      "STORAGE_SECRET",
      "AUTH_SECRET",
    ]) {
      expect(auth).not.toContain(`token.${secret}`);
    }
  });
});

describe("requireDatabaseUser prefers the token over a query", () => {
  const source = readFileSync(
    "features/auth/server/require-database-user.ts",
    "utf8",
  );

  it("returns early when the token carries the id", () => {
    expect(source).toContain("if (session.dbUserId)");
  });

  it("keeps a fallback for tokens issued before the claim existed", () => {
    expect(source).toContain("findOrCreateUserFromPublicProfile");
  });

  it("redirects rather than inventing a user when the session is absent", () => {
    expect(source).toContain('redirect("/sign-in")');
  });
});

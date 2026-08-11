import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const roots = ["app", "features", "lib"];
const providerEntryPoint = "getApplicationIntelligenceProvider";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      return walk(full);
    }

    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

const sourceFiles = roots.flatMap((root) => walk(root));

describe("only the analysis service may reach the AI provider", () => {
  const callers = sourceFiles.filter((file) => {
    if (file.replaceAll("\\", "/").startsWith("lib/ai/")) {
      return false;
    }

    return readFileSync(file, "utf8").includes(providerEntryPoint);
  });

  it("has exactly one caller outside lib/ai", () => {
    expect(callers.map((file) => file.replaceAll("\\", "/"))).toEqual([
      "features/analyses/server/analysis.service.ts",
    ]);
  });
});

describe("no feature calls a per-button AI action", () => {
  const retired = [
    "generateApplicationDocument",
    "analyzeResumeForJob",
    "generateImprovedResume",
    "runJobFitAnalysis",
    "analyzeResume(",
  ];

  it.each(retired)("%s no longer appears anywhere", (symbol) => {
    const offenders = sourceFiles.filter((file) =>
      readFileSync(file, "utf8").includes(symbol),
    );

    expect(offenders).toEqual([]);
  });
});

describe("document generation never reaches the provider", () => {
  it("the document service only reads stored analysis output", () => {
    const source = readFileSync(
      "features/documents/server/document.service.ts",
      "utf8",
    );

    expect(source).not.toContain(providerEntryPoint);
    expect(source).toContain("readStoredIntelligence");
  });

  it("the improved resume service only renders and stores", () => {
    const source = readFileSync(
      "features/documents/server/improved-resume.service.ts",
      "utf8",
    );

    expect(source).not.toContain(providerEntryPoint);
    expect(source).toContain("renderImprovedResumePdf");
  });
});

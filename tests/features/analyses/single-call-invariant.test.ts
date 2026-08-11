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

const ALLOWED_CALLERS = [
  "features/analyses/server/analysis.service.ts",
  "features/applications/server/job-extraction.service.ts",
];

describe("only the analysis and extraction services may reach the AI provider", () => {
  const callers = sourceFiles.filter((file) => {
    if (file.replaceAll("\\", "/").startsWith("lib/ai/")) {
      return false;
    }

    return readFileSync(file, "utf8").includes(providerEntryPoint);
  });

  it("has no callers outside the allow list", () => {
    expect(callers.map((file) => file.replaceAll("\\", "/")).sort()).toEqual(
      [...ALLOWED_CALLERS].sort(),
    );
  });
});

describe("analysis stays a single call per application", () => {
  it("only the analysis service calls analyzeApplication", () => {
    const callers = sourceFiles.filter((file) => {
      const path = file.replaceAll("\\", "/");

      if (path.startsWith("lib/ai/")) {
        return false;
      }

      return readFileSync(file, "utf8").includes(".analyzeApplication(");
    });

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

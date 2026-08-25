import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job, ResumeVersion } from "@/lib/db/schema";

const reserveUsage = vi.fn();
const completeUsage = vi.fn();
const failUsage = vi.fn();

const findAnalysisByInputHash = vi.fn();
const findAnalysisForApplication = vi.fn();
const createPendingAnalysis = vi.fn();
const resetAnalysisToPending = vi.fn();
const listCorrectionsForAnalysis = vi.fn();
const markAnalysisSucceeded = vi.fn();
const markAnalysisFailed = vi.fn();
const findFileAssetById = vi.fn();

vi.mock("@/features/usage/server/ai-usage.service", () => ({
  reserveUsage: (input: unknown) => reserveUsage(input),
  completeUsage: (input: unknown) => completeUsage(input),
  failUsage: (input: unknown) => failUsage(input),
}));

vi.mock("@/features/analyses/server/analysis.repository", () => ({
  findAnalysisByInputHash: (input: unknown) => findAnalysisByInputHash(input),
  findAnalysisForApplication: (input: unknown) =>
    findAnalysisForApplication(input),
  createPendingAnalysis: (input: unknown) => createPendingAnalysis(input),
  resetAnalysisToPending: (input: unknown) => resetAnalysisToPending(input),
  listCorrectionsForAnalysis: (input: unknown) =>
    listCorrectionsForAnalysis(input),
  markAnalysisSucceeded: (input: unknown) => markAnalysisSucceeded(input),
  markAnalysisFailed: (input: unknown) => markAnalysisFailed(input),
  attachAnalysisApplication: vi.fn(),
}));

vi.mock("@/features/files/server/file-asset.repository", () => ({
  findFileAssetById: (input: unknown) => findFileAssetById(input),
}));

const { analyzeApplication } =
  await import("@/features/analyses/server/analysis.service");

const job = {
  id: "job-1",
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  title: "Site Manager",
  company: "Turner",
  location: null,
  workArrangement: "ON_SITE",
  employmentType: "FULL_TIME",
  deadlineAt: null,
  source: null,
  sourceUrl: null,
  description: "Run the site.",
  requirements: null,
} as unknown as Job;

const version = {
  id: "version-1",
  fileAssetId: "asset-1",
  extractedText: "Ada Okonkwo resume text.",
} as unknown as ResumeVersion;

const analyze = vi.fn();

function run(regenerate?: boolean) {
  return analyzeApplication({
    userId: "user-1",
    job,
    version,
    applicationId: "application-1",
    regenerate,
    provider: {
      analyzeApplication: analyze,
      extractJobPosting: vi.fn(),
    } as never,
    storageProvider: {
      readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    } as never,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});

  findAnalysisByInputHash.mockResolvedValue(null);
  findAnalysisForApplication.mockResolvedValue(null);
  createPendingAnalysis.mockResolvedValue({
    id: "analysis-1",
    publicId: "public-1",
  });
  resetAnalysisToPending.mockResolvedValue({
    id: "analysis-1",
    publicId: "public-1",
  });
  listCorrectionsForAnalysis.mockResolvedValue([]);
  findFileAssetById.mockResolvedValue({
    id: "asset-1",
    storageKey: "resumes/one.pdf",
    originalFilename: "one.pdf",
    deletedAt: null,
  });
  markAnalysisFailed.mockResolvedValue(undefined);
});

describe("a spent allowance is reported as a limit, not a generic failure", () => {
  it.each([
    "DAILY_LIMIT",
    "BURST_LIMIT",
    "GLOBAL_LIMIT",
    "ACTIVE_REQUEST",
  ] as const)("carries the %s reason to the caller", async (reason) => {
    reserveUsage.mockResolvedValue({
      ok: false,
      reason,
      message: "You have used today's AI allowance for this action.",
      resetAt: new Date(),
    });

    const result = await run();

    expect(result).toMatchObject({
      ok: false,
      error: "LIMIT_REACHED",
      limitReason: reason,
    });
  });

  it("never reaches the AI provider", async () => {
    reserveUsage.mockResolvedValue({
      ok: false,
      reason: "DAILY_LIMIT",
      message: "Spent.",
      resetAt: new Date(),
    });

    await run();

    expect(analyze).not.toHaveBeenCalled();
    expect(completeUsage).not.toHaveBeenCalled();
    expect(failUsage).not.toHaveBeenCalled();
  });

  it("passes the user-facing message straight through", async () => {
    reserveUsage.mockResolvedValue({
      ok: false,
      reason: "BURST_LIMIT",
      message: "You have reached the short-term AI request limit.",
      resetAt: new Date(),
    });

    const result = await run();

    expect(result).toMatchObject({
      message: "You have reached the short-term AI request limit.",
    });
  });

  it("reports a limit on re-analysis too", async () => {
    reserveUsage.mockResolvedValue({
      ok: false,
      reason: "DAILY_LIMIT",
      message: "Spent.",
      resetAt: new Date(),
    });

    expect(await run(true)).toMatchObject({
      ok: false,
      error: "LIMIT_REACHED",
      limitReason: "DAILY_LIMIT",
    });
  });

  it("still marks the analysis row failed so nothing is left pending", async () => {
    reserveUsage.mockResolvedValue({
      ok: false,
      reason: "DAILY_LIMIT",
      message: "Spent.",
      resetAt: new Date(),
    });

    await run();

    expect(markAnalysisFailed).toHaveBeenCalledTimes(1);
    expect(markAnalysisFailed.mock.calls[0][0].failureReason).toBe(
      "DAILY_LIMIT",
    );
  });
});

describe("a provider failure is still a generic failure", () => {
  it("does not claim a limit was reached", async () => {
    reserveUsage.mockResolvedValue({ ok: true, reservationId: "res-1" });
    analyze.mockRejectedValue(new Error("provider exploded"));
    failUsage.mockResolvedValue(undefined);

    const result = await run();

    expect(result).toMatchObject({ ok: false, error: "FAILED" });
    expect(result).not.toHaveProperty("limitReason");
  });
});

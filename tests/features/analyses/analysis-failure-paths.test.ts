import {
  AiProviderChainError,
  AiProviderError,
} from "@/lib/ai/provider-errors";
import type { Job, ResumeVersion } from "@/lib/db/schema";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { beforeEach, describe, expect, it, vi } from "vitest";

const reserveUsage = vi.fn();
const completeUsage = vi.fn();
const failUsage = vi.fn();

const findAnalysisByInputHash = vi.fn();
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
  createPendingAnalysis: (input: unknown) => createPendingAnalysis(input),
  resetAnalysisToPending: (input: unknown) => resetAnalysisToPending(input),
  listCorrectionsForAnalysis: (input: unknown) =>
    listCorrectionsForAnalysis(input),
  markAnalysisSucceeded: (input: unknown) => markAnalysisSucceeded(input),
  markAnalysisFailed: (input: unknown) => markAnalysisFailed(input),
  findAnalysisForApplication: vi.fn(),
  attachAnalysisApplication: vi.fn(),
}));

vi.mock("@/features/files/server/file-asset.repository", () => ({
  findFileAssetById: (input: unknown) => findFileAssetById(input),
}));

const { analyzeApplication } =
  await import("@/features/analyses/server/analysis.service");

const VALID_RESULT = {
  scoring: {
    overallScore: 72,
    atsScore: 68,
    requirementsScore: 70,
    skillsScore: 75,
    experienceScore: 66,
    keywordScore: 64,
    explanation: "Solid overlap with the posting.",
  },
  recommendations: [],
  keywordAnalysis: {
    present: [],
    transferable: [],
    missing: [],
    avoidForcing: [],
  },
  requirementMatches: [],
  optimizationPlan: {
    alignment: "MEDIUM",
    intensity: "TARGETED",
    rationale: "Some overlap with the posting.",
    droppedEvidence: [],
  },
  improvedResume: {
    header: {
      name: "Jane Doe",
      headline: "Backend Engineer",
      location: null,
      email: null,
      phone: null,
      links: [],
    },
    professionalSummary: "Backend engineer.",
    skills: [],
    experience: [],
    projects: [],
    education: [],
    certifications: [],
    additionalSections: [],
  },
  bulletRewrites: [],
  professionalSummary: "Backend engineer.",
  coverLetter: "Dear hiring team,",
  applicationEmail: { subject: "Application", body: "Hello" },
  followUpMessage: "Following up on my application.",
};

const job = {
  id: "job-1",
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  title: "Backend Engineer",
  company: "Acme",
  location: null,
  workArrangement: "REMOTE",
  employmentType: "FULL_TIME",
  deadlineAt: null,
  source: null,
  sourceUrl: null,
  description: "Build services",
  requirements: null,
} as unknown as Job;

function version(extractedText: string | null) {
  return {
    id: "version-1",
    fileAssetId: "asset-1",
    extractedText,
  } as unknown as ResumeVersion;
}

function storage(bytes: Uint8Array) {
  return {
    readFile: vi.fn().mockResolvedValue(bytes),
  } as never;
}

function provider(analyze: () => Promise<unknown>) {
  return {
    analyzeApplication: analyze,
    extractJobPosting: vi.fn(),
  } as never;
}

function run(overrides: {
  analyze: () => Promise<unknown>;
  extractedText?: string | null;
  bytes?: Uint8Array;
}) {
  return analyzeApplication({
    userId: "user-1",
    job,
    version: version(
      overrides.extractedText === undefined
        ? "Jane Doe resume text"
        : overrides.extractedText,
    ),
    applicationId: "application-1",
    provider: provider(overrides.analyze),
    storageProvider: storage(overrides.bytes ?? new Uint8Array([1, 2, 3])),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});

  findAnalysisByInputHash.mockResolvedValue(null);
  createPendingAnalysis.mockResolvedValue({
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
  reserveUsage.mockResolvedValue({ ok: true, reservationId: "reservation-1" });
  markAnalysisSucceeded.mockResolvedValue({
    id: "analysis-1",
    publicId: "public-1",
  });
  markAnalysisFailed.mockResolvedValue(undefined);
  completeUsage.mockResolvedValue(undefined);
  failUsage.mockResolvedValue(undefined);
});

describe("a successful analysis", () => {
  it("consumes exactly one usage, after the analysis is persisted", async () => {
    const result = await run({
      analyze: async () => ({
        provider: "openrouter",
        model: "primary",
        rawResponse: JSON.stringify(VALID_RESULT),
        durationMs: 12,
      }),
    });

    expect(result.ok).toBe(true);
    expect(markAnalysisSucceeded).toHaveBeenCalledTimes(1);
    expect(completeUsage).toHaveBeenCalledTimes(1);
    expect(failUsage).not.toHaveBeenCalled();

    expect(markAnalysisSucceeded.mock.invocationCallOrder[0]).toBeLessThan(
      completeUsage.mock.invocationCallOrder[0],
    );
  });
});

describe("when every provider fails", () => {
  it("consumes no usage and returns a useful message", async () => {
    const result = await run({
      analyze: async () => {
        throw new AiProviderChainError("All configured AI providers failed", [
          {
            provider: "openrouter",
            model: "primary",
            attempt: 1,
            status: 503,
            code: "upstream",
            failureClass: "TRANSIENT",
            message: "upstream unavailable",
          },
        ]);
      },
    });

    expect(result).toMatchObject({ ok: false, error: "FAILED" });
    expect(completeUsage).not.toHaveBeenCalled();
    expect(failUsage).toHaveBeenCalledTimes(1);
    expect(markAnalysisFailed).toHaveBeenCalledTimes(1);

    if (!result.ok) {
      expect(result.message).toContain("allowance was not used");
    }
  });

  it("records the provider detail on the failed analysis row", async () => {
    await run({
      analyze: async () => {
        throw new AiProviderError("daily quota reached", {
          provider: "openrouter",
          model: "primary",
          status: 429,
        });
      },
    });

    expect(markAnalysisFailed.mock.calls[0][0].failureReason).toContain(
      "provider=openrouter",
    );
  });
});

describe("when the database fails after a good model response", () => {
  it("reports a database failure rather than an AI failure", async () => {
    markAnalysisSucceeded.mockRejectedValue(new TypeError("fetch failed"));

    const result = await run({
      analyze: async () => ({
        provider: "openrouter",
        model: "primary",
        rawResponse: JSON.stringify(VALID_RESULT),
        durationMs: 12,
      }),
    });

    expect(result).toMatchObject({ ok: false, error: "FAILED" });
    expect(completeUsage).not.toHaveBeenCalled();
    expect(failUsage.mock.calls[0][0].failureReason).toContain(
      "DatabaseFailure",
    );

    const logged = vi.mocked(console.error).mock.calls.at(-1);
    expect(logged?.[0]).toBe("Application analysis persistence failed");
    expect((logged?.[1] as { stage: string }).stage).toBe("PERSISTENCE");
  });
});

describe("when the model returns something the schema rejects", () => {
  it("fails the analysis instead of storing a broken result", async () => {
    const result = await run({
      analyze: async () => ({
        provider: "openrouter",
        model: "primary",
        rawResponse: JSON.stringify({ scoring: { overallScore: 10 } }),
        durationMs: 12,
      }),
    });

    expect(result).toMatchObject({ ok: false });
    expect(markAnalysisSucceeded).not.toHaveBeenCalled();
    expect(completeUsage).not.toHaveBeenCalled();
  });
});

describe("resume text", () => {
  it("is read out of the PDF when the column is empty", async () => {
    const document = await PDFDocument.create();
    const font = await document.embedFont(StandardFonts.Helvetica);
    document.addPage([612, 792]).drawText("Jane Doe - Backend Engineer", {
      x: 54,
      y: 720,
      size: 12,
      font,
    });

    const analyze = vi.fn().mockResolvedValue({
      provider: "openrouter",
      model: "primary",
      rawResponse: JSON.stringify(VALID_RESULT),
      durationMs: 12,
    });

    await run({
      analyze: analyze as never,
      extractedText: null,
      bytes: await document.save(),
    });

    expect(analyze.mock.calls[0][0].resume.text).toContain("Jane Doe");
  });
});

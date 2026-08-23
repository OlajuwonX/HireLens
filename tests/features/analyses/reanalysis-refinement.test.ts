import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Job, ResumeVersion } from "@/lib/db/schema";
import type { ApplicationIntelligenceInput } from "@/lib/ai/types";

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

const { analyzeApplication } = await import(
  "@/features/analyses/server/analysis.service"
);

const RESUME_TEXT = [
  "Ada Okonkwo — Frontend Engineer",
  "5+ years building React applications.",
  "Improved rendering performance by 30% across checkout.",
  "Cut defects by 40% by adding 20+ automated test suites.",
  "Deployed to Azure App Service with Express.js APIs.",
].join("\n");

function resumeWith(bullets: string[]) {
  return {
    header: {
      name: "Ada Okonkwo",
      headline: "Frontend Engineer",
      location: null,
      email: null,
      phone: null,
      links: [],
    },
    professionalSummary: "Frontend engineer with 5+ years of React delivery.",
    skills: [{ category: "Core", items: ["React", "Azure", "Express.js"] }],
    experience: [
      {
        company: "Turner",
        title: "Frontend Engineer",
        location: null,
        startDate: "2019",
        endDate: "Present",
        bullets,
      },
    ],
    projects: [],
    education: [],
    certifications: [],
    additionalSections: [],
  };
}

const STRONG_BULLETS = [
  "Improved rendering performance by 30% across checkout.",
  "Cut defects by 40% by adding 20+ automated test suites.",
];

const GENERICIZED_BULLETS = [
  "Improved performance across the product.",
  "Reduced defects through automated testing.",
];

function intelligence(bullets: string[]) {
  return {
    requirementMatches: [
      {
        key: "react",
        requirement: "Seven years of React",
        category: "EXPERIENCE",
        importance: "REQUIRED",
        status: "PARTIAL",
        resumeEvidence: "5+ years building React applications.",
        explanation: "The resume supports five years, not seven.",
        recommendation: null,
      },
    ],
    keywordAnalysis: {
      present: ["React"],
      transferable: [
        { required: "AWS", existingEvidence: "Deployed to Azure App Service." },
      ],
      missing: [
        {
          keyword: "Accessibility",
          gapType: "WORDING_ONLY",
          explanation: "The work is there but not named.",
        },
        {
          keyword: "Docker",
          gapType: "QUALIFICATION_GAP",
          explanation: "No container evidence on the resume.",
        },
      ],
      avoidForcing: ["Kubernetes"],
    },
    optimizationPlan: {
      alignment: "MEDIUM",
      intensity: "TARGETED",
      rationale: "React is proven, the seven-year bar is not.",
      droppedEvidence: [],
    },
    improvedResume: resumeWith(bullets),
    bulletRewrites: [],
    professionalSummary: "Frontend engineer with 5+ years of React delivery.",
    coverLetter: "Dear hiring team,",
    applicationEmail: { subject: "Application", body: "Hello" },
    followUpMessage: "Following up on my application.",
    recommendations: [],
    scoring: {
      overallScore: 68,
      atsScore: 70,
      requirementsScore: 62,
      skillsScore: 74,
      experienceScore: 60,
      keywordScore: 66,
      explanation: "Partial credit for the experience shortfall.",
    },
  };
}

const job = {
  id: "job-1",
  updatedAt: new Date("2026-01-01T00:00:00Z"),
  title: "Senior Frontend Engineer",
  company: "Acme",
  location: null,
  workArrangement: "REMOTE",
  employmentType: "FULL_TIME",
  deadlineAt: null,
  source: null,
  sourceUrl: null,
  description: "Seven years of React. AWS. Docker.",
  requirements: null,
} as unknown as Job;

const version = {
  id: "version-1",
  fileAssetId: "asset-1",
  extractedText: RESUME_TEXT,
} as unknown as ResumeVersion;

function run(options: {
  regenerate?: boolean;
  returns: ReturnType<typeof intelligence>;
}) {
  const analyze = vi.fn(async (input: ApplicationIntelligenceInput) => ({
    provider: "openrouter" as const,
    model: "primary",
    rawResponse: JSON.stringify(options.returns),
    durationMs: 12,
    calledWith: input,
  }));

  const promise = analyzeApplication({
    userId: "user-1",
    job,
    version,
    applicationId: "application-1",
    regenerate: options.regenerate,
    provider: {
      analyzeApplication: analyze,
      extractJobPosting: vi.fn(),
    } as never,
    storageProvider: {
      readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    } as never,
  });

  return { promise, analyze };
}

function storedAnalysis(bullets: string[]) {
  return {
    id: "analysis-1",
    publicId: "public-1",
    status: "SUCCEEDED",
    resultJson: intelligence(bullets),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
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
  reserveUsage.mockResolvedValue({ ok: true, reservationId: "reservation-1" });
  markAnalysisSucceeded.mockResolvedValue({
    id: "analysis-1",
    publicId: "public-1",
  });
  markAnalysisFailed.mockResolvedValue(undefined);
  completeUsage.mockResolvedValue(undefined);
  failUsage.mockResolvedValue(undefined);
});

describe("the first analysis is a broad optimization pass", () => {
  it("sends no previous optimization to the model", async () => {
    const { promise, analyze } = run({ returns: intelligence(STRONG_BULLETS) });

    await expect(promise).resolves.toMatchObject({ ok: true });
    expect(analyze.mock.calls[0][0].previousPass).toBeNull();
  });

  it("does not look up a previous analysis at all", async () => {
    const { promise } = run({ returns: intelligence(STRONG_BULLETS) });

    await promise;

    expect(findAnalysisForApplication).not.toHaveBeenCalled();
  });
});

describe("re-analyze refines the previous optimized resume", () => {
  beforeEach(() => {
    findAnalysisForApplication.mockResolvedValue(
      storedAnalysis(STRONG_BULLETS),
    );
    findAnalysisByInputHash.mockResolvedValue(storedAnalysis(STRONG_BULLETS));
  });

  it("treats the previous improved resume as the current artifact", async () => {
    const { promise, analyze } = run({
      regenerate: true,
      returns: intelligence(STRONG_BULLETS),
    });

    await expect(promise).resolves.toMatchObject({ ok: true });

    const previousPass = analyze.mock.calls[0][0].previousPass;

    expect(previousPass?.improvedResume).toContain(
      "Improved rendering performance by 30% across checkout.",
    );
    expect(previousPass?.professionalSummary).toContain("5+ years");
  });

  it("carries the requirements and wording gaps that are still open", async () => {
    const { promise, analyze } = run({
      regenerate: true,
      returns: intelligence(STRONG_BULLETS),
    });

    await promise;

    const previousPass = analyze.mock.calls[0][0].previousPass;

    expect(previousPass?.unresolvedRequirements).toEqual([
      "Seven years of React",
    ]);
    expect(previousPass?.unresolvedKeywords).toEqual(["Accessibility"]);
  });

  it("leaves a qualification gap out of the wording gaps", async () => {
    const { promise, analyze } = run({
      regenerate: true,
      returns: intelligence(STRONG_BULLETS),
    });

    await promise;

    expect(
      analyze.mock.calls[0][0].previousPass?.unresolvedKeywords,
    ).not.toContain("Docker");
  });
});

describe("the regression guard protects a re-analyzed resume", () => {
  beforeEach(() => {
    findAnalysisForApplication.mockResolvedValue(
      storedAnalysis(STRONG_BULLETS),
    );
    findAnalysisByInputHash.mockResolvedValue(storedAnalysis(STRONG_BULLETS));
  });

  it("keeps the previous resume when a pass genericizes the metrics away", async () => {
    const { promise } = run({
      regenerate: true,
      returns: intelligence(GENERICIZED_BULLETS),
    });

    await expect(promise).resolves.toMatchObject({ ok: true });

    const stored = markAnalysisSucceeded.mock.calls[0][0].resultJson;

    expect(stored.improvedResume.experience[0].bullets).toEqual(
      STRONG_BULLETS,
    );
  });

  it("still stores the rest of the new analysis", async () => {
    const { promise } = run({
      regenerate: true,
      returns: {
        ...intelligence(GENERICIZED_BULLETS),
        coverLetter: "A sharper second-pass letter.",
      },
    });

    await promise;

    const stored = markAnalysisSucceeded.mock.calls[0][0].resultJson;

    expect(stored.coverLetter).toBe("A sharper second-pass letter.");
  });

  it("accepts a pass that keeps the evidence intact", async () => {
    const improved = [
      "Improved checkout rendering performance by 30%, cutting abandoned carts.",
      "Cut defects by 40% by adding 20+ automated test suites.",
    ];

    const { promise } = run({
      regenerate: true,
      returns: intelligence(improved),
    });

    await promise;

    const stored = markAnalysisSucceeded.mock.calls[0][0].resultJson;

    expect(stored.improvedResume.experience[0].bullets).toEqual(improved);
  });
});

describe("the guard cannot fire without a previous pass", () => {
  it("stores a weaker first pass because there is nothing to fall back to", async () => {
    const { promise } = run({ returns: intelligence(GENERICIZED_BULLETS) });

    await promise;

    const stored = markAnalysisSucceeded.mock.calls[0][0].resultJson;

    expect(stored.improvedResume.experience[0].bullets).toEqual(
      GENERICIZED_BULLETS,
    );
  });
});

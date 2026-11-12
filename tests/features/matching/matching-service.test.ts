import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadCandidate: vi.fn(),
  listPostingsToMatch: vi.fn(),
  upsertMatches: vi.fn(),
  reserveUsage: vi.fn(),
  completeUsage: vi.fn(),
  failUsage: vi.fn(),
  matchJobs: vi.fn(),
}));

vi.mock("@/features/matching/server/candidate-context", () => ({ loadCandidate: mocks.loadCandidate }));
vi.mock("@/features/matching/server/match.repository", () => ({
  listPostingsToMatch: mocks.listPostingsToMatch,
  upsertMatches: mocks.upsertMatches,
}));
vi.mock("@/features/usage/server/ai-usage.service", () => ({
  reserveUsage: mocks.reserveUsage,
  completeUsage: mocks.completeUsage,
  failUsage: mocks.failUsage,
}));

const { runMatching } = await import("@/features/matching/server/matching.service");

const provider = {
  analyzeApplication: vi.fn(),
  extractJobPosting: vi.fn(),
  generateInterviewPool: vi.fn(),
  reviewResume: vi.fn(),
  matchJobs: mocks.matchJobs,
};

const candidate = {
  resumeText: "Frontend engineer, React and TypeScript, 4 years.",
  eligibility: {
    seniority: "MID",
    currentLocation: "Lagos",
    targetLocations: [],
    workArrangements: ["REMOTE"],
    authorizedCountries: ["Nigeria"],
    requiresSponsorship: false,
    willingToRelocate: false,
  },
  profileLines: ["Target roles: Frontend Engineer"],
  inputHash: "hash-1",
  targets: ["Frontend Engineer"],
};

const posting = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  title: "Frontend Engineer",
  company: "Acme",
  location: "Remote",
  workArrangement: "REMOTE",
  description: "React role",
  ...overrides,
});

const answer = (refs: string[]) => ({
  provider: "gemini",
  model: "m",
  durationMs: 1,
  rawResponse: JSON.stringify({
    matches: refs.map((ref) => ({
      ref,
      score: 82,
      fit: "STRONG",
      strengths: ["React", "TypeScript", "SaaS", "extra"],
      gaps: [],
      summary: "Strong fit.",
    })),
  }),
});

const run = () => runMatching({ userId: "user-1", provider: provider as never });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadCandidate.mockResolvedValue(candidate);
  mocks.listPostingsToMatch.mockResolvedValue([posting("p1"), posting("p2", { workArrangement: "ON_SITE" })]);
  mocks.reserveUsage.mockResolvedValue({ ok: true, reservationId: "r" });
  mocks.matchJobs.mockResolvedValue(answer(["J1"]));
  mocks.failUsage.mockResolvedValue(undefined);
});

describe("runMatching", () => {
  it("screens out ineligible jobs for free and scores the rest in one call", async () => {
    expect(await run()).toEqual({ ok: true, scored: 1, screenedOut: 1, waiting: 0 });
    expect(mocks.matchJobs).toHaveBeenCalledTimes(1);

    const [screened] = mocks.upsertMatches.mock.calls[0][0];
    expect(screened).toMatchObject({ postingId: "p2", verdict: "FAIL", score: null });

    const [scored] = mocks.upsertMatches.mock.calls[1][0];
    expect(scored).toMatchObject({ postingId: "p1", score: 82, rank: 82, fit: "STRONG", inputHash: "hash-1" });
    expect(scored.insight.strengths).toHaveLength(3);
  });

  it("sends short refs, never internal ids", async () => {
    await run();

    const content = mocks.matchJobs.mock.calls[0][0].content as string;
    expect(content).toContain('<job ref="J1">');
    expect(content).not.toContain("p1");
  });

  it("sends at most ten jobs and reports how many wait", async () => {
    mocks.listPostingsToMatch.mockResolvedValue(Array.from({ length: 13 }, (_, i) => posting(`p${i}`)));

    const outcome = await run();
    const content = mocks.matchJobs.mock.calls[0][0].content as string;

    expect(content.match(/<job ref=/g)).toHaveLength(10);
    expect(outcome).toMatchObject({ waiting: 3 });
  });

  it("leaves jobs the model skipped unscored for next time", async () => {
    mocks.listPostingsToMatch.mockResolvedValue([posting("p1"), posting("p2")]);

    await run();

    expect(mocks.upsertMatches.mock.calls.at(-1)![0]).toHaveLength(1);
  });

  it("spends no quota when nothing is eligible", async () => {
    mocks.listPostingsToMatch.mockResolvedValue([posting("p2", { workArrangement: "ON_SITE" })]);

    expect(await run()).toEqual({ ok: true, scored: 0, screenedOut: 1, waiting: 0 });
    expect(mocks.reserveUsage).not.toHaveBeenCalled();
  });

  it("keeps the free screening when the daily limit is reached", async () => {
    mocks.reserveUsage.mockResolvedValue({ ok: false, message: "Limit reached" });

    expect(await run()).toEqual({ ok: false, message: "Limit reached", screenedOut: 1 });
    expect(mocks.upsertMatches).toHaveBeenCalledTimes(1);
    expect(mocks.matchJobs).not.toHaveBeenCalled();
  });

  it("refunds and saves nothing scored when the model fails", async () => {
    mocks.matchJobs.mockRejectedValue(new Error("down"));

    expect((await run()).ok).toBe(false);
    expect(mocks.failUsage).toHaveBeenCalledTimes(1);
    expect(mocks.completeUsage).not.toHaveBeenCalled();
    expect(mocks.upsertMatches).toHaveBeenCalledTimes(1);
  });

  it("asks for a resume when none is readable", async () => {
    mocks.loadCandidate.mockResolvedValue(null);

    expect(await run()).toMatchObject({ ok: false, screenedOut: 0 });
    expect(mocks.listPostingsToMatch).not.toHaveBeenCalled();
  });
});

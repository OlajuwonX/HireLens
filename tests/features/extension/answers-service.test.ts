import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadAnswersContext: vi.fn(),
  reserveUsage: vi.fn(),
  completeUsage: vi.fn(),
  failUsage: vi.fn(),
}));

vi.mock("@/features/extension/server/answers-context", () => ({ loadAnswersContext: mocks.loadAnswersContext }));
vi.mock("@/features/usage/server/ai-usage.service", () => ({
  reserveUsage: mocks.reserveUsage,
  completeUsage: mocks.completeUsage,
  failUsage: mocks.failUsage,
}));

const { writeFormAnswers } = await import("@/features/extension/server/answers.service");

const worker = { userId: "user-1", workerId: "w-1" };
const request = {
  url: "https://jobs.example.test/apply",
  applicationPublicId: null,
  pageText: "Engineer at Acme",
  questions: [
    { id: "why", label: "Why Acme?", kind: "textarea" as const, required: true, options: [], maxLength: null },
    {
      id: "source",
      label: "How did you hear about us?",
      kind: "select" as const,
      required: true,
      options: ["LinkedIn", "Referral"],
      maxLength: null,
    },
    {
      id: "clearance",
      label: "Do you hold a security clearance?",
      kind: "text" as const,
      required: false,
      options: [],
      maxLength: null,
    },
  ],
};
const provider = (answers: { id: string; answer: string }[]) => ({
  answerForm: vi.fn().mockResolvedValue({
    provider: "gemini",
    model: "m",
    durationMs: 1,
    rawResponse: JSON.stringify({ answers }),
  }),
});
const context = {
  job: "<job_posting>\nAcme\n</job_posting>",
  profile: "Name: Ada",
  savedAnswers: [],
  resume: "Resume",
  coverLetter: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadAnswersContext.mockResolvedValue(context);
  mocks.reserveUsage.mockResolvedValue({ ok: true, reservationId: "r-1" });
  mocks.failUsage.mockResolvedValue(undefined);
});

describe("writeFormAnswers", () => {
  it("writes answers for the open questions and leaves unknowns to the candidate", async () => {
    const ai = provider([
      { id: "why", answer: "I build developer tools and Acme builds the best ones." },
      { id: "source", answer: "Job board" },
      { id: "clearance", answer: "" },
    ]);

    expect(await writeFormAnswers(worker, request, ai as never)).toEqual({
      ok: true,
      answers: [{ id: "why", answer: "I build developer tools and Acme builds the best ones." }],
    });
    expect(ai.answerForm.mock.calls[0][0].content).toContain("- id: source");
    expect(mocks.completeUsage).toHaveBeenCalledWith(
      expect.objectContaining({ action: "FORM_ANSWERS", reservationId: "r-1" }),
    );
  });

  it("uses the page text when the job is not saved in HireLens", async () => {
    await writeFormAnswers(worker, request, provider([]) as never);

    expect(mocks.loadAnswersContext).toHaveBeenCalledWith({
      userId: "user-1",
      applicationPublicId: null,
      pageText: "Engineer at Acme",
    });
  });

  it("says so when the daily answer allowance is used up", async () => {
    mocks.reserveUsage.mockResolvedValue({ ok: false, reason: "DAILY_LIMIT", message: "Limit reached." });

    expect(await writeFormAnswers(worker, request, provider([]) as never)).toEqual({
      ok: false,
      limited: true,
      message: "Limit reached.",
    });
  });

  it("refunds the allowance when the AI fails", async () => {
    const ai = { answerForm: vi.fn().mockRejectedValue(new Error("boom")) };

    expect(await writeFormAnswers(worker, request, ai as never)).toMatchObject({ ok: false, limited: false });
    expect(mocks.failUsage).toHaveBeenCalledWith(expect.objectContaining({ action: "FORM_ANSWERS", reservationId: "r-1" }));
    expect(mocks.completeUsage).not.toHaveBeenCalled();
  });

  it("needs a resume to write from", async () => {
    mocks.loadAnswersContext.mockResolvedValue(null);

    expect(await writeFormAnswers(worker, request, provider([]) as never)).toMatchObject({ ok: false, limited: false });
    expect(mocks.reserveUsage).not.toHaveBeenCalled();
  });
});

describe("buildFormAnswersPrompt", () => {
  it("gives the extension the same prompt Gemini gets, asking for JSON, without spending the allowance", async () => {
    const { buildFormAnswersPrompt } = await import("@/features/extension/server/answers.service");
    const result = await buildFormAnswersPrompt(worker, request);

    expect(result).toMatchObject({ ok: true });
    expect(result.ok && result.system).toContain("Honesty rules");
    expect(result.ok && result.system).toContain('{"answers":[{"id"');
    expect(result.ok && result.prompt).toContain("- id: why");
    expect(mocks.reserveUsage).not.toHaveBeenCalled();
  });

  it("needs a resume", async () => {
    const { buildFormAnswersPrompt } = await import("@/features/extension/server/answers.service");

    mocks.loadAnswersContext.mockResolvedValue(null);

    expect(await buildFormAnswersPrompt(worker, request)).toMatchObject({ ok: false });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listSavedJobRefs: vi.fn(),
  findApplicationRowForUser: vi.fn(),
  loadCandidateFacts: vi.fn(),
  loadIntelligence: vi.fn(),
  loadApplicationResume: vi.fn(),
  loadDefaultResume: vi.fn(),
}));

vi.mock("@/features/discovery/server/feed.repository", () => ({ listSavedJobRefs: mocks.listSavedJobRefs }));
vi.mock("@/features/applications/server/application.repository", () => ({
  findApplicationRowForUser: mocks.findApplicationRowForUser,
}));
vi.mock("@/features/worker/server/candidate-facts", () => ({ loadCandidateFacts: mocks.loadCandidateFacts }));
vi.mock("@/features/worker/server/task-payload", () => ({ loadIntelligence: mocks.loadIntelligence }));
vi.mock("@/features/worker/server/resume-file", () => ({
  loadApplicationResume: mocks.loadApplicationResume,
  loadDefaultResume: mocks.loadDefaultResume,
}));

const { buildFillData, loadExtensionResume } = await import("@/features/extension/server/fill.service");

const worker = { userId: "user-1", workerId: "w-1" };
const appId = "22222222-2222-4222-8222-222222222222";
const row = {
  application: { id: "a-1", publicId: appId, analysisId: "an-1" },
  job: { title: "Frontend Engineer", company: "Acme" },
  matchScore: 78,
};
const facts = { candidate: { firstName: "Ada" }, answers: [{ question: "Why us?", answer: "Because." }] };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadCandidateFacts.mockResolvedValue(facts);
  mocks.listSavedJobRefs.mockResolvedValue([
    { applicationPublicId: appId, sourceUrl: "https://jobs.lever.co/acme/123", company: "Acme", title: "Frontend Engineer" },
  ]);
  mocks.findApplicationRowForUser.mockResolvedValue(row);
  mocks.loadIntelligence.mockResolvedValue({ coverLetter: "Dear Acme", improvedResume: { experience: [{}] } });
});

describe("buildFillData", () => {
  it("links the apply page to the saved job and its tailored resume", async () => {
    const data = await buildFillData(worker, "https://jobs.lever.co/acme/123/apply");

    expect(data).toMatchObject({
      application: { publicId: appId, title: "Frontend Engineer", company: "Acme" },
      candidate: facts.candidate,
      answers: facts.answers,
      coverLetter: "Dear Acme",
      coverLetterPath: `/api/extension/cover-letter?application=${appId}`,
      match: { score: 78, analyzed: true },
      resume: { path: `/api/extension/resume?application=${appId}`, tailored: true },
    });
    expect(mocks.findApplicationRowForUser).toHaveBeenCalledWith({ userId: "user-1", publicId: appId });
  });

  it("still fills unknown pages with the profile and the default resume", async () => {
    const data = await buildFillData(worker, "https://careers.example.com/job/9");

    expect(data.application).toBeNull();
    expect(data.coverLetter).toBeNull();
    expect(data.coverLetterPath).toBeNull();
    expect(data.match).toEqual({ score: null, analyzed: false });
    expect(data.resume).toEqual({ path: "/api/extension/resume", tailored: false });
    expect(mocks.loadIntelligence).not.toHaveBeenCalled();
  });

  it("uses the original resume when the job was saved but never analyzed", async () => {
    mocks.loadIntelligence.mockResolvedValue(null);

    expect((await buildFillData(worker, "https://jobs.lever.co/acme/123")).resume.tailored).toBe(false);
  });
});

describe("loadExtensionResume", () => {
  it("serves the resume chosen for the known job", async () => {
    mocks.loadApplicationResume.mockResolvedValue({ bytes: new Uint8Array([1]), tailored: true });

    expect(await loadExtensionResume(worker, appId)).toEqual({ bytes: new Uint8Array([1]), tailored: true });
    expect(mocks.loadApplicationResume).toHaveBeenCalledWith("user-1", row);
  });

  it("falls back to the default resume", async () => {
    mocks.loadDefaultResume.mockResolvedValue({ bytes: new Uint8Array([2]), tailored: false });

    expect(await loadExtensionResume(worker)).toEqual({ bytes: new Uint8Array([2]), tailored: false });
    expect(mocks.findApplicationRowForUser).not.toHaveBeenCalled();
  });

  it("never serves another user's application resume", async () => {
    mocks.findApplicationRowForUser.mockResolvedValue(null);
    mocks.loadDefaultResume.mockResolvedValue(null);

    expect(await loadExtensionResume(worker, appId)).toBeNull();
    expect(mocks.loadApplicationResume).not.toHaveBeenCalled();
    expect(mocks.loadDefaultResume).toHaveBeenCalledWith("user-1");
  });
});

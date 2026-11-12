import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findPostingForUser: vi.fn(),
  hasSavedJobWithUrl: vi.fn(),
  listOwnedVersionOptions: vi.fn(),
  saveJobOnly: vi.fn(),
}));

vi.mock("@/features/discovery/server/feed.repository", () => ({
  findPostingForUser: mocks.findPostingForUser,
  hasSavedJobWithUrl: mocks.hasSavedJobWithUrl,
}));
vi.mock("@/features/resumes/server/resume-version.service", () => ({
  listOwnedVersionOptions: mocks.listOwnedVersionOptions,
}));
vi.mock("@/features/applications/server/application.service", () => ({
  saveJobOnly: mocks.saveJobOnly,
}));

const { savePostingToJobs } = await import("@/features/discovery/server/posting-save.service");
const { decodeCursor, encodeCursor } = await import("@/features/discovery/feed-cursor");

const versionId = "11111111-1111-4111-8111-111111111111";
const posting = {
  title: "Frontend Engineer",
  company: "Acme",
  location: "Remote",
  workArrangement: "REMOTE",
  employmentType: "FULL_TIME",
  salaryMin: 100000,
  salaryMax: 120000,
  currency: "USD",
  description: "",
  url: "https://boards.greenhouse.io/acme/jobs/1",
  applyUrl: null,
  source: "GREENHOUSE",
};

const run = () => savePostingToJobs({ userId: "user-1", publicId: "p-1" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findPostingForUser.mockResolvedValue(posting);
  mocks.hasSavedJobWithUrl.mockResolvedValue(false);
  mocks.listOwnedVersionOptions.mockResolvedValue([{ publicId: versionId }]);
  mocks.saveJobOnly.mockResolvedValue({ ok: true, value: { applicationPublicId: "a" } });
});

describe("savePostingToJobs", () => {
  it("saves through the normal saved-jobs flow with the default resume", async () => {
    expect(await run()).toEqual({ ok: true, alreadySaved: false });

    const values = mocks.saveJobOnly.mock.calls[0][0].values;

    expect(values).toMatchObject({
      resumeVersionPublicId: versionId,
      title: "Frontend Engineer",
      source: "Greenhouse",
      sourceUrl: posting.url,
      workArrangement: "REMOTE",
    });
    expect(values.description).toContain(posting.url);
  });

  it("prefers the apply link so Auto Apply can recognise the site", async () => {
    mocks.findPostingForUser.mockResolvedValue({ ...posting, url: "https://stripe.com/jobs?gh_jid=1", applyUrl: "https://boards.greenhouse.io/stripe/jobs/1" });

    await run();

    expect(mocks.saveJobOnly.mock.calls[0][0].values.sourceUrl).toBe("https://boards.greenhouse.io/stripe/jobs/1");
    expect(mocks.hasSavedJobWithUrl).toHaveBeenCalledWith({ userId: "user-1", url: "https://boards.greenhouse.io/stripe/jobs/1" });
  });

  it("does not save the same posting twice", async () => {
    mocks.hasSavedJobWithUrl.mockResolvedValue(true);

    expect(await run()).toEqual({ ok: true, alreadySaved: true });
    expect(mocks.saveJobOnly).not.toHaveBeenCalled();
  });

  it("asks for a resume first", async () => {
    mocks.listOwnedVersionOptions.mockResolvedValue([]);

    expect(await run()).toEqual({ ok: false, message: "Upload a resume before saving jobs." });
  });

  it("refuses a posting from a board the user does not follow", async () => {
    mocks.findPostingForUser.mockResolvedValue(null);

    expect((await run()).ok).toBe(false);
    expect(mocks.saveJobOnly).not.toHaveBeenCalled();
  });
});

describe("feed cursor", () => {
  const row = { sortAt: new Date("2026-11-01T00:00:00Z"), publicId: "22222222-2222-4222-8222-222222222222" };

  it("round-trips", () => {
    expect(decodeCursor(encodeCursor(row))).toEqual(row);
  });

  it("rejects tampered values", () => {
    expect(decodeCursor("garbage")).toBeNull();
    expect(decodeCursor("2026-11-01T00:00:00.000Z~'; drop table")).toBeNull();
    expect(decodeCursor(undefined)).toBeNull();
  });
});

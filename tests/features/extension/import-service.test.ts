import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listSavedJobRefs: vi.fn(),
  listOwnedVersionOptions: vi.fn(),
  extractJobPosting: vi.fn(),
  saveJobOnly: vi.fn(),
  findAtsPosting: vi.fn(),
}));

vi.mock("@/features/discovery/server/feed.repository", () => ({ listSavedJobRefs: mocks.listSavedJobRefs }));
vi.mock("@/features/resumes/server/resume-version.service", () => ({
  listOwnedVersionOptions: mocks.listOwnedVersionOptions,
}));
vi.mock("@/features/applications/server/job-extraction.service", () => ({
  extractJobPosting: mocks.extractJobPosting,
}));
vi.mock("@/features/applications/server/application.service", () => ({ saveJobOnly: mocks.saveJobOnly }));
vi.mock("@/features/extension/server/ats-posting", async (original) => ({
  ...(await original<typeof import("@/features/extension/server/ats-posting")>()),
  findAtsPosting: mocks.findAtsPosting,
}));

const { importPageJob } = await import("@/features/extension/server/import.service");

const worker = { userId: "user-1", workerId: "w-1" };
const versionId = "11111111-1111-4111-8111-111111111111";
const page = { url: "https://boards.greenhouse.io/acme/jobs/9", title: "Engineer", text: "A long job posting" };
const job = {
  title: "Platform Engineer",
  company: null,
  location: "Remote",
  workArrangement: "REMOTE",
  employmentType: null,
  salaryMin: null,
  salaryMax: null,
  currency: null,
  source: null,
  sourceUrl: null,
  description: "Build the platform.",
  requirements: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listSavedJobRefs.mockResolvedValue([]);
  mocks.listOwnedVersionOptions.mockResolvedValue([{ publicId: versionId }]);
  mocks.extractJobPosting.mockResolvedValue({ ok: true, job, method: "PARSED" });
  mocks.saveJobOnly.mockResolvedValue({ ok: true, value: { applicationPublicId: "app-9" } });
  mocks.findAtsPosting.mockResolvedValue(null);
});

describe("importPageJob", () => {
  it("saves the job on the page with the default resume", async () => {
    expect(await importPageJob(worker, page)).toEqual({ ok: true, applicationPublicId: "app-9", created: true });
    expect(mocks.saveJobOnly).toHaveBeenCalledWith({
      userId: "user-1",
      values: expect.objectContaining({
        resumeVersionPublicId: versionId,
        title: "Platform Engineer",
        company: "Acme",
        sourceUrl: page.url,
        description: "Build the platform.",
        source: "Browser extension",
      }),
    });
  });

  it("reuses a job that is already saved for this page", async () => {
    mocks.listSavedJobRefs.mockResolvedValue([
      { applicationPublicId: "app-1", sourceUrl: "https://boards.greenhouse.io/acme/jobs/9" },
    ]);

    expect(await importPageJob(worker, page)).toEqual({ ok: true, applicationPublicId: "app-1", created: false });
    expect(mocks.extractJobPosting).not.toHaveBeenCalled();
  });

  it("refuses pages without a readable posting", async () => {
    mocks.extractJobPosting.mockResolvedValue({ ok: true, job: { ...job, description: null }, method: "MANUAL" });

    expect(await importPageJob(worker, page)).toEqual({
      ok: false,
      message: "HireLens could not read a job posting on this page.",
    });
    expect(mocks.saveJobOnly).not.toHaveBeenCalled();
  });

  it("asks for a resume first", async () => {
    mocks.listOwnedVersionOptions.mockResolvedValue([]);

    expect(await importPageJob(worker, page)).toEqual({ ok: false, message: "Upload a resume to HireLens first." });
  });
});

describe("importPageJob on an application form page", () => {
  const formPage = {
    url: "https://jobs.ashbyhq.com/walrusfi/aa6fd41d-bdbd-4e88-bf32-73af8aa3a662/application",
    title: "Senior Software Engineer (Full Stack) @ Walrus",
    text: "Upload your resume here to autofill key application fields. Are you authorized to work?",
  };
  const posting = {
    sourceId: "aa6fd41d-bdbd-4e88-bf32-73af8aa3a662",
    title: "Senior Software Engineer (Full Stack)",
    company: "Walrusfi",
    location: "Remote",
    workArrangement: "REMOTE",
    employmentType: "FULL_TIME",
    salaryMin: null,
    salaryMax: null,
    currency: null,
    description: "We are building storage for the web. You will own features end to end.",
    url: "https://jobs.ashbyhq.com/walrusfi/aa6fd41d-bdbd-4e88-bf32-73af8aa3a662",
    applyUrl: null,
    postedAt: null,
  };

  it("reads the real posting from the job board instead of the form", async () => {
    mocks.findAtsPosting.mockResolvedValue(posting);

    await importPageJob(worker, formPage);

    const content = mocks.extractJobPosting.mock.calls[0][0].content as string;
    expect(content).toContain(posting.description);
    expect(content).not.toContain("Upload your resume");
    expect(mocks.saveJobOnly).toHaveBeenCalledWith({
      userId: "user-1",
      values: expect.objectContaining({ title: posting.title, sourceUrl: formPage.url }),
    });
  });

  it("still saves the board posting when the AI reader fails", async () => {
    mocks.findAtsPosting.mockResolvedValue(posting);
    mocks.extractJobPosting.mockResolvedValue({ ok: false });

    await importPageJob(worker, formPage);

    expect(mocks.saveJobOnly).toHaveBeenCalledWith({
      userId: "user-1",
      values: expect.objectContaining({ description: posting.description, company: "Walrusfi" }),
    });
  });
});

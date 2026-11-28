import { describe, expect, it, vi } from "vitest";
import { findAtsPosting } from "@/features/extension/server/ats-posting";
import { postingRefFromUrl } from "@/lib/discovery/posting-ref";

const ashbyId = "aa6fd41d-bdbd-4e88-bf32-73af8aa3a662";

describe("postingRefFromUrl", () => {
  it.each([
    [`https://jobs.ashbyhq.com/walrusfi/${ashbyId}/application?jr_id=1`, { source: "ASHBY", token: "walrusfi", jobId: ashbyId }],
    [`https://jobs.ashbyhq.com/walrusfi/${ashbyId}`, { source: "ASHBY", token: "walrusfi", jobId: ashbyId }],
    ["https://jobs.lever.co/acme/1b2c3d4e-0000-4000-8000-000000000000/apply", { source: "LEVER", token: "acme", jobId: "1b2c3d4e-0000-4000-8000-000000000000" }],
    ["https://boards.greenhouse.io/acme/jobs/4012345", { source: "GREENHOUSE", token: "acme", jobId: "4012345" }],
    ["https://job-boards.greenhouse.io/acme/jobs/4012345?gh_src=x", { source: "GREENHOUSE", token: "acme", jobId: "4012345" }],
    ["https://boards.greenhouse.io/embed/job_app?for=acme&token=4012345", { source: "GREENHOUSE", token: "acme", jobId: "4012345" }],
  ])("reads %s", (url, expected) => {
    expect(postingRefFromUrl(url)).toEqual(expected);
  });

  it.each([
    "https://jobs.ashbyhq.com/walrusfi",
    "https://boards.greenhouse.io/acme",
    "https://example.com/careers/123",
    "not a url",
  ])("ignores %s", (url) => {
    expect(postingRefFromUrl(url)).toBeNull();
  });
});

describe("findAtsPosting", () => {
  const board = {
    jobs: [
      {
        id: ashbyId,
        title: "Senior Software Engineer (Full Stack)",
        jobUrl: `https://jobs.ashbyhq.com/walrusfi/${ashbyId}`,
        descriptionPlain: "We are building storage for the web.",
        location: "Remote",
      },
    ],
  };

  it("finds the job on its public board", async () => {
    const fetchJson = vi.fn().mockResolvedValue(board);
    const posting = await findAtsPosting(`https://jobs.ashbyhq.com/walrusfi/${ashbyId}/application`, fetchJson);

    expect(fetchJson).toHaveBeenCalledWith(expect.stringContaining("posting-api/job-board/walrusfi"));
    expect(posting?.description).toBe("We are building storage for the web.");
  });

  it("returns nothing when the job is gone or the board fails", async () => {
    const missing = vi.fn().mockResolvedValue({ jobs: [] });
    const failing = vi.fn().mockRejectedValue(new Error("down"));
    const url = `https://jobs.ashbyhq.com/walrusfi/${ashbyId}`;

    expect(await findAtsPosting(url, missing)).toBeNull();
    expect(await findAtsPosting(url, failing)).toBeNull();
  });

  it("does not call out for other sites", async () => {
    const fetchJson = vi.fn();

    expect(await findAtsPosting("https://example.com/jobs/1", fetchJson)).toBeNull();
    expect(fetchJson).not.toHaveBeenCalled();
  });
});

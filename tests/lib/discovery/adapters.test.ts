import { describe, expect, it, vi } from "vitest";
import { adapters } from "@/lib/discovery/sources";
import { ashbyPayload, greenhousePayload, leverPayload } from "../../fixtures/discovery/payloads";

const serve = (payload: unknown) => vi.fn(async (_url: string) => payload);

const greenhouseFetch = serve(greenhousePayload);
const greenhouse = await adapters.GREENHOUSE.fetchBoard("acme", greenhouseFetch);
const lever = await adapters.LEVER.fetchBoard("globex", serve(leverPayload));
const ashby = await adapters.ASHBY.fetchBoard("initech", serve(ashbyPayload));

describe("greenhouse adapter", () => {
  const snapshot = greenhouse;
  const [job] = snapshot.postings;

  it("calls the public board API with content", () => {
    expect(greenhouseFetch).toHaveBeenCalledWith(
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true",
    );
  });

  it("uses the company name the board reports", () => {
    expect(snapshot.companyName).toBe("Acme");
  });

  it("decodes escaped HTML into readable text", () => {
    expect(job.description).toContain("Build React & TypeScript apps.");
    expect(job.description).not.toContain("<");
    expect(job.description).not.toContain("&lt;");
  });

  it("maps title, location, arrangement, type, salary and dates", () => {
    expect(job).toMatchObject({
      sourceId: "101",
      title: "Senior Frontend Engineer",
      location: "Remote - Europe",
      workArrangement: "REMOTE",
      employmentType: "NOT_SPECIFIED",
      salaryMin: 120000,
      salaryMax: 150000,
    });
    expect(job.postedAt?.toISOString()).toBe("2026-10-01T13:00:00.000Z");
  });

  it("reads employment type from the title only, never from free text", async () => {
    const intern = await adapters.GREENHOUSE.fetchBoard(
      "acme",
      serve({ jobs: [{ id: 1, title: "Software Engineering Intern", absolute_url: "https://x.test/1", content: "smart contract work" }] }),
    );

    expect(intern.postings[0].employmentType).toBe("INTERNSHIP");
  });

  it("drops postings with unsafe links or no title", () => {
    expect(snapshot.postings.map((posting) => posting.sourceId)).toEqual(["101"]);
  });
});

describe("lever adapter", () => {
  const snapshot = lever;
  const [job] = snapshot.postings;

  it("derives the company from the board name", () => {
    expect(snapshot.companyName).toBe("Globex");
  });

  it("combines the description, lists and closing text", () => {
    expect(job.description).toContain("Join the web team.");
    expect(job.description).toContain("Requirements");
    expect(job.description).toContain("React");
    expect(job.description).toContain("We value curiosity.");
  });

  it("maps workplace, commitment, salary range and apply link", () => {
    expect(job).toMatchObject({
      workArrangement: "HYBRID",
      employmentType: "FULL_TIME",
      salaryMin: 30000,
      salaryMax: 45000,
      currency: "USD",
      applyUrl: "https://jobs.lever.co/globex/4f1c2b8e-0000-4000-8000-000000000001/apply",
    });
    expect(job.postedAt).toEqual(new Date(1790000000000));
  });
});

describe("ashby adapter", () => {
  const snapshot = ashby;
  const [job] = snapshot.postings;

  it("skips unlisted postings", () => {
    expect(snapshot.postings).toHaveLength(1);
  });

  it("maps arrangement, contract type and compensation", () => {
    expect(job).toMatchObject({
      title: "React Native Engineer",
      workArrangement: "REMOTE",
      employmentType: "CONTRACT",
      salaryMin: 60000,
      salaryMax: 80000,
      description: "Ship mobile features.",
    });
  });
});

describe("every adapter survives a malformed response", () => {
  it.each(["GREENHOUSE", "LEVER", "ASHBY"] as const)("%s returns no postings", async (source) => {
    const snapshot = await adapters[source].fetchBoard("x", serve("<html>oops</html>"));

    expect(snapshot.postings).toEqual([]);
  });
});

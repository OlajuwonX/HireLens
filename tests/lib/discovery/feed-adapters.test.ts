import { describe, expect, it, vi } from "vitest";
import { SYSTEM_BOARDS } from "@/lib/discovery/catalog";
import { adapters } from "@/lib/discovery/sources";
import { FEED_SOURCES } from "@/lib/discovery/types";
import { arbeitnowPayload, himalayasPayload, jobicyPayload, remotivePayload, wwrFeed } from "../../fixtures/discovery/feeds";

const serve = (payload: unknown) => vi.fn(async (_url: string, _as?: "json" | "text") => payload);

describe("Remotive", () => {
  it("maps a remote job and drops unsafe links", async () => {
    const { postings } = await adapters.REMOTIVE.fetchBoard("all", serve(remotivePayload));

    expect(postings).toHaveLength(1);
    expect(postings[0]).toMatchObject({
      title: "Frontend Engineer",
      company: "Globex",
      location: "Worldwide",
      workArrangement: "REMOTE",
      employmentType: "FULL_TIME",
      salaryMin: 80000,
      salaryMax: 100000,
      description: "Build React apps.",
    });
    expect(postings[0].postedAt?.toISOString()).toBe("2026-11-11T20:17:48.000Z");
  });
});

describe("Jobicy", () => {
  it("maps structured salary and region", async () => {
    const { postings } = await adapters.JOBICY.fetchBoard("all", serve(jobicyPayload));

    expect(postings[0]).toMatchObject({
      company: "TRM Labs",
      location: "Remote - USA",
      salaryMin: 180000,
      salaryMax: 230000,
      currency: "USD",
    });
  });
});

describe("Arbeitnow", () => {
  it("reads several pages and converts unix dates", async () => {
    const fetch = serve(arbeitnowPayload);
    const { postings } = await adapters.ARBEITNOW.fetchBoard("all", fetch);

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(postings[0]).toMatchObject({ company: "Initech GmbH", workArrangement: "REMOTE", location: "Berlin" });
    expect(postings[0].postedAt).toEqual(new Date(1794693685 * 1000));
  });
});

describe("Himalayas", () => {
  it("pages through results and keeps location restrictions", async () => {
    const fetch = serve(himalayasPayload);
    const { postings } = await adapters.HIMALAYAS.fetchBoard("all", fetch);

    expect(fetch).toHaveBeenCalledWith("https://himalayas.app/jobs/api?limit=20&offset=40");
    expect(postings[0]).toMatchObject({ company: "Hooli", location: "Remote - Europe, Africa", employmentType: "CONTRACT" });
  });
});

describe("We Work Remotely", () => {
  it("parses the RSS feed into company and title", async () => {
    const fetch = serve(wwrFeed);
    const { postings } = await adapters.WEWORKREMOTELY.fetchBoard("all", fetch);

    expect(fetch).toHaveBeenCalledWith("https://weworkremotely.com/remote-jobs.rss", "text");
    expect(postings).toHaveLength(1);
    expect(postings[0]).toMatchObject({
      company: "Vandelay Industries",
      title: "Senior Front-End Engineer",
      location: "Remote - Anywhere in the World",
      description: "Build & ship.",
    });
  });
});

describe("feeds survive malformed responses", () => {
  it.each(FEED_SOURCES)("%s returns nothing", async (source) => {
    expect((await adapters[source].fetchBoard("all", serve("<html>oops</html>"))).postings).toEqual([]);
  });
});

describe("the built-in catalog", () => {
  it("includes every feed and many company boards, without duplicates", () => {
    const keys = SYSTEM_BOARDS.map((board) => `${board.source}:${board.token}`);

    expect(new Set(keys).size).toBe(keys.length);
    expect(FEED_SOURCES.every((source) => keys.includes(`${source}:all`))).toBe(true);
    expect(SYSTEM_BOARDS.length).toBeGreaterThan(90);
  });

  it("uses only safe board names", () => {
    expect(SYSTEM_BOARDS.every((board) => /^[A-Za-z0-9._-]+$/.test(board.token))).toBe(true);
  });
});

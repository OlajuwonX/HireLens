import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

const actions = read("features/discovery/actions/discovery-actions.ts");
const feed = read("features/discovery/server/feed.repository.ts");
const cron = read("app/api/cron/discover-jobs/route.ts");
const vercel = JSON.parse(read("vercel.json")) as { crons: { path: string }[] };
const migration = read("drizzle/0031_job_discovery.sql");

describe("discovery actions", () => {
  it("authenticate in every exported action", () => {
    const exported = actions.match(/export async function/g) ?? [];
    const guarded = actions.match(/await requireDatabaseUser\(\)/g) ?? [];

    expect(guarded.length).toBe(exported.length);
  });

  it("never trust a user id from the client", () => {
    expect(actions).not.toMatch(/userId: (input|formData)/);
  });
});

describe("the feed is scoped to what each user may see", () => {
  const visibility = read("features/discovery/server/visibility.ts");
  const matching = read("features/matching/server/match.repository.ts");

  it("joins only the current user's follows", () => {
    expect(visibility).toContain("eq(jobBoardFollows.userId, userId)");
  });

  it("shows followed boards, or built-in boards whose titles match the user's roles", () => {
    expect(visibility).toContain("isNotNull(jobBoardFollows.id)");
    expect(visibility).toContain("eq(jobBoards.system, true)");
    expect(visibility).toContain("titleMatchesSql(audience.matcher, jobPostings.title)");
  });

  it("uses the same visibility for the feed, job details and matching", () => {
    expect(feed.match(/followedBy\(input\.audience\.userId\)/g)?.length).toBe(3);
    expect(feed.match(/baseConditions\(input\.audience, /g)?.length).toBe(2);
    expect(feed).toContain("visibleTo(input.audience)");
    expect(matching).toContain("audienceConditions(input.audience");
  });
});

describe("the discovery cron", () => {
  it("is protected by the shared cron secret check", () => {
    expect(cron).toContain("isAuthorizedCron(request)");
    expect(cron.indexOf("isAuthorizedCron")).toBeLessThan(cron.indexOf("runDailyDiscovery()"));
  });

  it("is scheduled once a day", () => {
    expect(vercel.crons.map((entry) => entry.path)).toContain("/api/cron/discover-jobs");
  });
});

describe("the discovery migration", () => {
  it("only creates new tables and indexes", () => {
    expect(migration).not.toMatch(/\bDROP\b|\bALTER COLUMN\b|\bRENAME\b/i);
  });

  it("makes postings unique per board and source id", () => {
    expect(migration).toContain('UNIQUE INDEX "job_postings_board_source_idx"');
  });

  it("removes follows when the user is deleted", () => {
    expect(migration).toMatch(/job_board_follows_user_id_users_id_fk[\s\S]*?ON DELETE cascade/);
  });
});

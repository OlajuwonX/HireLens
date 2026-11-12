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

describe("the feed is scoped to followed boards", () => {
  it("joins the user's follows in every read", () => {
    expect(feed.match(/eq\(jobBoardFollows\.userId, (input\.)?userId\)/g)?.length).toBeGreaterThanOrEqual(2);
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

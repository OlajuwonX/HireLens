import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

function routes(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    return statSync(full).isDirectory() ? routes(full) : entry === "route.ts" ? [full] : [];
  });
}

const lease = read("features/worker/server/lease.repository.ts");
const tokenRepository = read("features/worker/server/token.repository.ts");
const migration = read("drizzle/0034_worker_tokens.sql");

describe("worker API routes", () => {
  const files = routes("app/api/worker");

  it("exist for ping, claim, heartbeat, result and resume", () => {
    expect(files).toHaveLength(5);
  });

  it("all authenticate through the worker route wrapper", () => {
    for (const file of files) {
      expect(read(file), file).toContain("workerRoute(");
    }
  });
});

describe("leases", () => {
  it("claim only approved tasks, one worker at a time", () => {
    expect(lease).toContain("state = 'APPROVED'");
    expect(lease).toContain("for update skip locked");
  });

  it("only let the worker holding the lease report or extend it", () => {
    const owned = lease.slice(lease.indexOf("function owned"));

    expect(owned).toContain("eq(applicationTasks.leaseOwner, input.workerId)");
    expect(owned).toContain('eq(applicationTasks.state, "SUBMITTING")');
  });

  it("turn abandoned submissions into unconfirmed, never back into approved", () => {
    const reconcile = lease.slice(lease.indexOf("reconcileExpiredLeases"), lease.indexOf("claimApprovedTask"));

    expect(reconcile).toContain('state: "SUBMISSION_UNCONFIRMED"');
    expect(reconcile).not.toContain('"APPROVED"');
  });
});

describe("token storage", () => {
  it("never stores the raw token", () => {
    expect(tokenRepository).toContain("tokenHash");
    expect(tokenRepository).not.toMatch(/\btoken:/);
    expect(migration).toContain('"token_hash" text NOT NULL');
    expect(migration).not.toMatch(/\bDROP\b|\bALTER COLUMN\b|\bRENAME\b/i);
  });
});

describe("the local worker package", () => {
  it("is kept out of the web app build", () => {
    expect(read("tsconfig.json")).toContain('"local-worker"');
    expect(read("eslint.config.mjs")).toContain("local-worker/**");
  });

  it("never commits secrets or browser data", () => {
    const ignore = read("local-worker/.gitignore");

    expect(ignore).toContain(".env");
    expect(ignore).toContain(".browser-profile");
  });
});

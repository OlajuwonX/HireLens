import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = join(process.cwd(), "scripts", "check-migrations.mjs");

let dir: string | undefined;

function runOn(sql: string) {
  dir = mkdtempSync(join(tmpdir(), "hirelens-mig-"));
  writeFileSync(join(dir, "0001_test.sql"), sql);

  try {
    const stdout = execFileSync("node", [SCRIPT, dir], { encoding: "utf8" });
    return { code: 0, output: stdout };
  } catch (error) {
    const err = error as { status: number; stdout: string; stderr: string };
    return { code: err.status, output: `${err.stdout}${err.stderr}` };
  }
}

afterEach(() => {
  if (dir) {
    rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  }
});

describe("migration safety check", () => {
  it("rejects a NOT NULL column added without a default", () => {
    const result = runOn(`ALTER TABLE "users" ADD COLUMN "plan" text NOT NULL;`);

    expect(result.code).toBe(1);
    expect(result.output).toContain("add-not-null-without-default");
  });

  it("accepts a NOT NULL column added with a default", () => {
    const result = runOn(
      `ALTER TABLE "users" ADD COLUMN "locale" text NOT NULL DEFAULT 'en';`,
    );

    expect(result.code).toBe(0);
  });

  it("accepts a nullable column", () => {
    const result = runOn(`ALTER TABLE "users" ADD COLUMN "headline" text;`);

    expect(result.code).toBe(0);
  });

  it("rejects dropping a column", () => {
    const result = runOn(`ALTER TABLE "resumes" DROP COLUMN "notes";`);

    expect(result.code).toBe(1);
    expect(result.output).toContain("drop-column");
  });

  it("rejects dropping a table", () => {
    const result = runOn(`DROP TABLE "sessions";`);

    expect(result.code).toBe(1);
    expect(result.output).toContain("drop-table");
  });

  it("rejects a rename", () => {
    const result = runOn(
      `ALTER TABLE "jobs" RENAME COLUMN "company" TO "employer";`,
    );

    expect(result.code).toBe(1);
    expect(result.output).toContain("rename");
  });

  it("rejects making an existing column required", () => {
    const result = runOn(
      `ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;`,
    );

    expect(result.code).toBe(1);
    expect(result.output).toContain("set-not-null");
  });

  it("rejects a column type change", () => {
    const result = runOn(
      `ALTER TABLE "users" ALTER COLUMN "public_id" SET DATA TYPE text;`,
    );

    expect(result.code).toBe(1);
    expect(result.output).toContain("change-type");
  });

  it("does not flag creating a table with NOT NULL columns", () => {
    const result = runOn(
      `CREATE TABLE "widgets" ("id" uuid PRIMARY KEY NOT NULL, "name" text NOT NULL);`,
    );

    expect(result.code).toBe(0);
  });

  it("does not flag adding a foreign key constraint", () => {
    const result = runOn(
      `ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id");`,
    );

    expect(result.code).toBe(0);
  });

  it("allows an explicit acknowledgement to waive a rule", () => {
    const result = runOn(
      `-- migration-check: allow drop-column never read by deployed code\nALTER TABLE "resumes" DROP COLUMN "notes";`,
    );

    expect(result.code).toBe(0);
    expect(result.output).toContain("waived");
  });

  it("waives only the acknowledged rule", () => {
    const result = runOn(
      `-- migration-check: allow drop-column fine\nALTER TABLE "resumes" DROP COLUMN "notes";\n--> statement-breakpoint\nDROP TABLE "sessions";`,
    );

    expect(result.code).toBe(1);
    expect(result.output).toContain("drop-table");
  });
});

describe("the real migrations", () => {
  it("pass the check", () => {
    const stdout = execFileSync("node", [SCRIPT], { encoding: "utf8" });

    expect(stdout).toContain("No backwards-incompatible changes found");
  });
});

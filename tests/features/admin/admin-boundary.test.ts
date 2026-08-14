import { scrubValue } from "@/lib/observability/scrub";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);

    return statSync(full).isDirectory()
      ? walk(full)
      : /\.tsx?$/.test(entry)
        ? [full]
        : [];
  });
}

describe("every admin surface authorizes on the server", () => {
  const adminPages = walk("app/(admin)").filter((file) =>
    file.endsWith("page.tsx"),
  );

  it("finds the admin pages", () => {
    expect(adminPages.length).toBeGreaterThan(0);
  });

  it.each(adminPages)("%s calls requireAdminUser", (file) => {
    expect(readFileSync(file, "utf8")).toContain("requireAdminUser()");
  });

  it("re-checks authorisation inside the status mutation", () => {
    const source = readFileSync(
      "features/bug-reports/actions/bug-report-actions.ts",
      "utf8",
    );

    expect(source).toContain("await requireAdminUser()");
  });

  it("returns not-found rather than confirming the route exists", () => {
    const guard = readFileSync(
      "features/admin/server/require-admin.ts",
      "utf8",
    );

    expect(guard).toContain("notFound()");
    expect(guard).toContain('role !== "ADMIN"');
  });
});

describe("the bug report never trusts the client for identity", () => {
  const actions = readFileSync(
    "features/bug-reports/actions/bug-report-actions.ts",
    "utf8",
  );

  it("derives the user from the session", () => {
    expect(actions).toContain("await requireDatabaseUser()");
    expect(actions).toContain("userId: user.id");
  });

  it("never reads a user id from the form", () => {
    expect(actions).not.toContain('getString(formData, "userId")');
  });
});

describe("Sentry scrubbing", () => {
  it("redacts sensitive keys at any depth", () => {
    const scrubbed = scrubValue({
      safe: "keep",
      resumeText: "secret",
      nested: { coverLetter: "secret", token: "secret", id: "keep" },
      list: [{ description: "secret", route: "/keep" }],
    }) as Record<string, unknown>;

    expect(scrubbed.safe).toBe("keep");
    expect(scrubbed.resumeText).toBe("[redacted]");
    expect((scrubbed.nested as Record<string, unknown>).coverLetter).toBe(
      "[redacted]",
    );
    expect((scrubbed.nested as Record<string, unknown>).token).toBe(
      "[redacted]",
    );
    expect((scrubbed.nested as Record<string, unknown>).id).toBe("keep");

    const [first] = scrubbed.list as Record<string, unknown>[];

    expect(first.description).toBe("[redacted]");
    expect(first.route).toBe("/keep");
  });

  it("leaves primitives untouched", () => {
    expect(scrubValue("plain")).toBe("plain");
    expect(scrubValue(42)).toBe(42);
    expect(scrubValue(null)).toBeNull();
  });

  it("stops runaway recursion", () => {
    let deep: Record<string, unknown> = { value: "bottom" };

    for (let index = 0; index < 20; index += 1) {
      deep = { nested: deep };
    }

    expect(() => scrubValue(deep)).not.toThrow();
  });
});

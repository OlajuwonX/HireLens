import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ADMIN_SEARCH_REPOSITORIES = [
  "features/admin/server/user-admin.repository.ts",
  "features/admin/server/audit-log.repository.ts",
  "features/bug-reports/server/bug-report.repository.ts",
];

describe("search repositories escape LIKE wildcards", () => {
  it.each(ADMIN_SEARCH_REPOSITORIES)("%s uses likePattern", (file) => {
    const source = readFileSync(file, "utf8");

    expect(source).toContain("likePattern(");
  });

  it.each(ADMIN_SEARCH_REPOSITORIES)(
    "%s never builds a raw percent pattern from user input",
    (file) => {
      const source = readFileSync(file, "utf8");

      expect(source).not.toMatch(/`%\$\{[^}]*\}%`/);
    },
  );
});

describe("the debounced search component", () => {
  const source = readFileSync("components/ui/debounced-search.tsx", "utf8");

  it("takes its delay from the shared 300 ms constant", () => {
    expect(source).toContain("SEARCH_DEBOUNCE_MS");
    expect(source).not.toContain("350");
  });

  it("keeps onSearch out of the timer effect dependencies", () => {
    expect(source).toContain("onSearchRef");
    expect(source).not.toMatch(/\[draft,[^\]]*onSearch[^\]]*\]/);
  });

  it("no longer resets the draft from the value on every change", () => {
    expect(source).not.toMatch(/setDraft\(value\)/);
    expect(source).toContain("reconcile(");
  });
});

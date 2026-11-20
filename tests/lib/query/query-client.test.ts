import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createQueryClient, QUERY_DEFAULTS } from "@/lib/query/query-client";
import { queryKeys } from "@/lib/query/query-keys";

describe("createQueryClient", () => {
  it("applies the shared defaults to queries", () => {
    const defaults = createQueryClient().getDefaultOptions().queries;

    expect(defaults).toMatchObject(QUERY_DEFAULTS);
    expect(defaults?.refetchOnWindowFocus).toBe(false);
  });

  it("never retries mutations", () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(0);
  });

  it("returns a fresh client each time so users never share a cache", () => {
    expect(createQueryClient()).not.toBe(createQueryClient());
  });
});

describe("queryKeys", () => {
  it("scopes feeds by their filters", () => {
    expect(queryKeys.savedJobs({ status: "PENDING" })).toEqual([
      "saved-jobs",
      { status: "PENDING" },
    ]);
    expect(queryKeys.documents({ type: "" })).not.toEqual(
      queryKeys.savedJobs({ type: "" }),
    );
  });
});

describe("the dashboard is wrapped in the query provider", () => {
  const layout = readFileSync("app/(dashboard)/layout.tsx", "utf8");

  it("mounts QueryProvider around the shell", () => {
    expect(layout.indexOf("<QueryProvider>")).toBeLessThan(
      layout.indexOf("<SearchProvider"),
    );
  });
});

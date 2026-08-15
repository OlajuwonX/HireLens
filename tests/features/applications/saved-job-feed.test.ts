import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { APPLICATION_PAGE_SIZE } from "@/features/applications/constants";

const feed = readFileSync(
  "features/applications/components/saved-job-feed.tsx",
  "utf8",
);
const page = readFileSync("app/(dashboard)/dashboard/jobs/page.tsx", "utf8");
const action = readFileSync(
  "features/applications/actions/application-feed-actions.ts",
  "utf8",
);

describe("saved jobs scroll instead of paginating", () => {
  it("has no load-more button and no page param", () => {
    expect(page).not.toContain("LoadMore");
    expect(page).not.toContain("currentPage");
    expect(feed).not.toContain("Show more");
  });

  it("loads on intersection, ahead of the viewport", () => {
    expect(feed).toContain("IntersectionObserver");
    expect(feed).toContain('PREFETCH_MARGIN = "600px"');
    expect(feed).toContain("rootMargin");
  });

  it("puts the skeletons inside the same grid", () => {
    const gridIndex = feed.indexOf("grid grid-cols-2");
    const skeletonIndex = feed.indexOf("<JobCardSkeleton />");
    const listCloseIndex = feed.indexOf("</ul>");

    expect(skeletonIndex).toBeGreaterThan(gridIndex);
    expect(skeletonIndex).toBeLessThan(listCloseIndex);
  });

  it("appends and deduplicates rather than replacing", () => {
    expect(feed).toContain("...current,");
    expect(feed).toContain("seen.has(row.publicId)");
  });

  it("guards overlapping requests and stops at the end", () => {
    expect(feed).toContain("inFlight.current");
    expect(feed).toContain("offset === null");
  });

  it("keeps the optimistic card behaviour", () => {
    expect(feed).toContain("<SavedJobCard");
    expect(feed).toContain("archived={Boolean(row.archivedAt)}");
  });

  it("resets when the filters change", () => {
    expect(page).toContain("key={JSON.stringify(filters)}");
  });

  it("announces loading to screen readers", () => {
    expect(feed).toContain('aria-live="polite"');
    expect(feed).toContain("aria-busy={loading}");
  });

  it("offers a retry when a page fails", () => {
    expect(feed).toContain("Try again");
  });
});

describe("the saved jobs paging action is safe", () => {
  it("authenticates before querying", () => {
    const auth = action.indexOf("await requireDatabaseUser()");
    const query = action.indexOf("await getApplicationBoard(");

    expect(auth).toBeGreaterThan(-1);
    expect(auth).toBeLessThan(query);
  });

  it("revalidates the filters server-side", () => {
    expect(action).toContain("applicationFiltersSchema.safeParse");
  });

  it("clamps a hostile offset", () => {
    expect(action).toContain("Number.isFinite(input.offset)");
    expect(action).toContain("Math.floor(input.offset)");
  });

  it("takes the user from the session", () => {
    expect(action).toContain("userId: user.id");
    expect(action).not.toContain("userId: input");
  });

  it("only exports async functions, as use-server requires", () => {
    const runtimeExports = [
      ...action.matchAll(
        /^export (?!type\b)(?:const|function|async function|let|var)\s+\w+/gm,
      ),
    ].map((match) => match[0]);

    for (const declaration of runtimeExports) {
      expect(declaration).toContain("async function");
    }
  });

  it("shares one page size with the server render", () => {
    expect(APPLICATION_PAGE_SIZE).toBe(24);
    expect(page).toContain("APPLICATION_PAGE_SIZE + 1");
    expect(action).toContain("APPLICATION_PAGE_SIZE + 1");
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DOCUMENT_PAGE_SIZE } from "@/features/documents/constants";

const feed = readFileSync(
  "features/documents/components/document-feed.tsx",
  "utf8",
);
const page = readFileSync(
  "app/(dashboard)/dashboard/documents/page.tsx",
  "utf8",
);
const action = readFileSync(
  "features/documents/actions/document-feed-actions.ts",
  "utf8",
);

describe("the documents list scrolls instead of paginating", () => {
  it("has no load-more button on the page", () => {
    expect(page).not.toContain("LoadMore");
    expect(feed).not.toContain("Load more");
  });

  it("no longer reads a cursor from the url", () => {
    expect(page).not.toContain('readParam(raw, "cursor")');
  });

  it("loads on intersection rather than on click", () => {
    expect(feed).toContain("IntersectionObserver");
    expect(feed).toContain("isIntersecting");
  });

  it("starts fetching before the sentinel is on screen", () => {
    expect(feed).toContain("rootMargin");
    expect(feed).toContain('PREFETCH_MARGIN = "600px"');
  });

  it("shows skeleton cards inside the same grid while loading", () => {
    const gridIndex = feed.indexOf("grid grid-cols-1");
    const skeletonIndex = feed.indexOf("<DocumentCardSkeleton />");
    const listCloseIndex = feed.indexOf("</ul>");

    expect(skeletonIndex).toBeGreaterThan(gridIndex);
    expect(skeletonIndex).toBeLessThan(listCloseIndex);
  });
});

describe("the feed appends rather than replaces", () => {
  it("keeps existing rows when a page arrives", () => {
    expect(feed).toContain("...current,");
  });

  it("deduplicates by publicId", () => {
    expect(feed).toContain("seen.has(row.publicId)");
  });

  it("guards against overlapping requests", () => {
    expect(feed).toContain("inFlight.current");
  });

  it("stops observing once there is no cursor", () => {
    expect(feed).toContain("if (!sentinel || !cursor || failed)");
  });

  it("offers a retry when a page fails", () => {
    expect(feed).toContain("Try again");
    expect(feed).toContain("setFailed(true)");
  });

  it("announces loading to screen readers", () => {
    expect(feed).toContain('aria-live="polite"');
    expect(feed).toContain("aria-busy={loading}");
  });

  it("resets when the filters change", () => {
    expect(page).toContain("key={JSON.stringify(filters)}");
  });
});

describe("the paging action is safe", () => {
  it("authenticates before reading anything", () => {
    const auth = action.indexOf("await requireDatabaseUser()");
    const query = action.indexOf("await getDocumentBoard(");

    expect(auth).toBeGreaterThan(-1);
    expect(auth).toBeLessThan(query);
  });

  it("validates the cursor as a timestamp", () => {
    expect(action).toContain("z.iso.datetime()");
  });

  it("never trusts a client-supplied user id", () => {
    expect(action).toContain("userId: user.id");
    expect(action).not.toContain("userId: input");
  });

  it("only exports async functions, as use-server requires", () => {
    const runtimeExports = [
      ...action.matchAll(/^export (?!type\b)(?:const|function|async function|let|var)\s+(\w+)/gm),
    ].map((match) => match[0]);

    for (const declaration of runtimeExports) {
      expect(declaration).toContain("async function");
    }
  });

  it("shares one page size with the server render", () => {
    expect(DOCUMENT_PAGE_SIZE).toBe(24);
    expect(page).toContain("DOCUMENT_PAGE_SIZE + 1");
    expect(action).toContain("DOCUMENT_PAGE_SIZE + 1");
  });
});

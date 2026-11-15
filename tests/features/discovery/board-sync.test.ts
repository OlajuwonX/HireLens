import { beforeEach, describe, expect, it, vi } from "vitest";
import { greenhousePayload } from "../../fixtures/discovery/payloads";

const mocks = vi.hoisted(() => ({
  markBoardFetched: vi.fn(),
  countActivePostings: vi.fn(),
  expireMissing: vi.fn(),
  recanonicalize: vi.fn(),
  upsertPostings: vi.fn(),
}));

vi.mock("@/features/discovery/server/board.repository", () => ({
  markBoardFetched: mocks.markBoardFetched,
}));
vi.mock("@/features/discovery/server/posting.repository", () => ({
  countActivePostings: mocks.countActivePostings,
  expireMissing: mocks.expireMissing,
  recanonicalize: mocks.recanonicalize,
  upsertPostings: mocks.upsertPostings,
}));

const { relevantSnapshot, syncBoard, toPostingValues } = await import("@/features/discovery/server/board-sync");
const { BoardFetchError } = await import("@/lib/discovery/http");
const { buildRoleMatcher } = await import("@/lib/discovery/role-match");

const board = { id: "board-1", source: "GREENHOUSE", token: "acme" };
const posting = (title: string) => ({
  sourceId: title,
  title,
  company: "Acme",
  location: null,
  workArrangement: "REMOTE" as const,
  employmentType: "FULL_TIME" as const,
  salaryMin: null,
  salaryMax: null,
  currency: null,
  description: "d",
  url: `https://x.test/${encodeURIComponent(title)}`,
  applyUrl: null,
  postedAt: null,
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.countActivePostings.mockResolvedValue(1);
  mocks.expireMissing.mockResolvedValue(["acme|old role"]);
});

describe("toPostingValues", () => {
  it("falls back to the first-seen time for sorting and stores a fuzzy dedupe key", () => {
    const seenAt = new Date("2026-11-12T06:00:00Z");
    const [value] = toPostingValues({
      boardId: "b",
      snapshot: { companyName: "Acme", postings: [posting("Sr. Front-End Developer")] },
      seenAt,
    });

    expect(value.sortAt).toEqual(seenAt);
    expect(value.dedupeKey).toBe("acme|senior frontend engineer");
  });
});

describe("relevantSnapshot", () => {
  const snapshot = { companyName: "Acme", postings: [posting("Frontend Engineer"), posting("Accountant")] };

  it("keeps only titles matching the target roles on built-in boards", () => {
    const kept = relevantSnapshot(snapshot, buildRoleMatcher(["Frontend Developer"]));

    expect(kept.postings.map((item) => item.title)).toEqual(["Frontend Engineer"]);
  });

  it("keeps everything on boards a user follows", () => {
    expect(relevantSnapshot(snapshot, null).postings).toHaveLength(2);
  });
});

describe("syncBoard", () => {
  it("stores postings, expires the missing ones and re-ranks duplicates for both", async () => {
    const result = await syncBoard(board, vi.fn(async () => greenhousePayload));

    expect(result).toEqual({ ok: true, active: 1 });
    expect(mocks.upsertPostings).toHaveBeenCalledTimes(1);
    expect(mocks.recanonicalize).toHaveBeenCalledWith(expect.arrayContaining(["acme|old role", "acme|senior frontend engineer"]));
    expect(mocks.markBoardFetched).toHaveBeenCalledWith({ boardId: "board-1", postingCount: 1, error: null });
  });

  it("filters a built-in board by the role matcher before storing", async () => {
    await syncBoard(board, vi.fn(async () => greenhousePayload), buildRoleMatcher(["Accountant"]));

    expect(mocks.upsertPostings.mock.calls[0][0]).toEqual([]);
  });

  it("never expires postings when the board cannot be fetched", async () => {
    const failing = vi.fn(async () => {
      throw new BoardFetchError("The job board responded with 503", 503);
    });

    const result = await syncBoard(board, failing);

    expect(result).toEqual({ ok: false, error: "The job board responded with 503" });
    expect(mocks.expireMissing).not.toHaveBeenCalled();
    expect(mocks.upsertPostings).not.toHaveBeenCalled();
  });

  it("hides unexpected error details", async () => {
    const result = await syncBoard(board, vi.fn(async () => {
      throw new Error("secret internals");
    }));

    expect(result).toEqual({ ok: false, error: "The board could not be synced" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { greenhousePayload } from "../../fixtures/discovery/payloads";

const mocks = vi.hoisted(() => ({
  markBoardFetched: vi.fn(),
  countActivePostings: vi.fn(),
  expireMissing: vi.fn(),
  findCanonicalIds: vi.fn(),
  upsertPostings: vi.fn(),
}));

vi.mock("@/features/discovery/server/board.repository", () => ({
  markBoardFetched: mocks.markBoardFetched,
}));
vi.mock("@/features/discovery/server/posting.repository", () => ({
  countActivePostings: mocks.countActivePostings,
  expireMissing: mocks.expireMissing,
  findCanonicalIds: mocks.findCanonicalIds,
  upsertPostings: mocks.upsertPostings,
}));

const { syncBoard, toPostingValues } = await import("@/features/discovery/server/board-sync");
const { BoardFetchError } = await import("@/lib/discovery/http");
const { dedupeKey } = await import("@/lib/discovery/normalize");

const board = { id: "board-1", source: "GREENHOUSE", token: "acme" };
const posting = {
  sourceId: "1",
  title: "Engineer",
  company: "Acme",
  location: null,
  workArrangement: "REMOTE" as const,
  employmentType: "FULL_TIME" as const,
  salaryMin: null,
  salaryMax: null,
  currency: null,
  description: "d",
  url: "https://x.test/1",
  applyUrl: null,
  postedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findCanonicalIds.mockResolvedValue(new Map());
  mocks.countActivePostings.mockResolvedValue(1);
});

describe("toPostingValues", () => {
  const seenAt = new Date("2026-11-12T06:00:00Z");

  it("falls back to the first-seen time for sorting when no posted date exists", () => {
    const [value] = toPostingValues({
      boardId: "b",
      snapshot: { companyName: "Acme", postings: [posting] },
      seenAt,
      canonical: new Map(),
    });

    expect(value.sortAt).toEqual(seenAt);
    expect(value.lastSeenAt).toEqual(seenAt);
    expect(value.duplicateOfId).toBeNull();
  });

  it("points a cross-source duplicate at the canonical posting", () => {
    const [value] = toPostingValues({
      boardId: "b",
      snapshot: { companyName: "Acme", postings: [posting] },
      seenAt,
      canonical: new Map([[dedupeKey(posting), "canonical-id"]]),
    });

    expect(value.duplicateOfId).toBe("canonical-id");
  });
});

describe("syncBoard", () => {
  it("stores postings, expires the missing ones and records the count", async () => {
    const result = await syncBoard(board, vi.fn(async () => greenhousePayload));

    expect(result).toEqual({ ok: true, active: 1 });
    expect(mocks.upsertPostings).toHaveBeenCalledTimes(1);
    expect(mocks.expireMissing).toHaveBeenCalledWith(expect.objectContaining({ boardId: "board-1" }));
    expect(mocks.markBoardFetched).toHaveBeenCalledWith({ boardId: "board-1", postingCount: 1, error: null });
  });

  it("never expires postings when the board cannot be fetched", async () => {
    const failing = vi.fn(async () => {
      throw new BoardFetchError("The job board responded with 503", 503);
    });

    const result = await syncBoard(board, failing);

    expect(result).toEqual({ ok: false, error: "The job board responded with 503" });
    expect(mocks.expireMissing).not.toHaveBeenCalled();
    expect(mocks.upsertPostings).not.toHaveBeenCalled();
    expect(mocks.markBoardFetched).toHaveBeenCalledWith({
      boardId: "board-1",
      error: "The job board responded with 503",
    });
  });

  it("hides unexpected error details", async () => {
    const result = await syncBoard(board, vi.fn(async () => {
      throw new Error("secret internals");
    }));

    expect(result).toEqual({ ok: false, error: "The board could not be synced" });
  });
});

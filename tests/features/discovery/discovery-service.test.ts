import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  countFollows: vi.fn(),
  findBoard: vi.fn(),
  followBoard: vi.fn(),
  listDueBoards: vi.fn(),
  upsertBoard: vi.fn(),
  fetchSnapshot: vi.fn(),
  storeSnapshot: vi.fn(),
  syncBoard: vi.fn(),
  purgeExpiredPostings: vi.fn(),
  seedSystemBoards: vi.fn(),
  listAllTargetRoles: vi.fn(),
}));

vi.mock("@/features/discovery/server/board.repository", () => ({
  countFollows: mocks.countFollows,
  findBoard: mocks.findBoard,
  followBoard: mocks.followBoard,
  listDueBoards: mocks.listDueBoards,
  upsertBoard: mocks.upsertBoard,
  seedSystemBoards: mocks.seedSystemBoards,
}));
vi.mock("@/features/discovery/server/board-sync", () => ({
  fetchSnapshot: mocks.fetchSnapshot,
  storeSnapshot: mocks.storeSnapshot,
  syncBoard: mocks.syncBoard,
}));
vi.mock("@/features/discovery/server/posting.repository", () => ({
  purgeExpiredPostings: mocks.purgeExpiredPostings,
}));
vi.mock("@/features/candidate-profile/server/profile.repository", () => ({
  listAllTargetRoles: mocks.listAllTargetRoles,
}));

const { followJobBoard, refreshDiscovery, runDailyDiscovery } = await import(
  "@/features/discovery/server/discovery.service"
);
const { BoardFetchError } = await import("@/lib/discovery/http");

const userId = "user-1";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.countFollows.mockResolvedValue(0);
  mocks.findBoard.mockResolvedValue(null);
  mocks.fetchSnapshot.mockResolvedValue({ companyName: "Acme", postings: [] });
  mocks.upsertBoard.mockResolvedValue({ id: "board-1", companyName: "Acme" });
  mocks.storeSnapshot.mockResolvedValue(7);
  mocks.purgeExpiredPostings.mockResolvedValue(0);
  mocks.listAllTargetRoles.mockResolvedValue(["Frontend Engineer"]);
});

describe("followJobBoard", () => {
  it("fetches a new board, stores it and follows it", async () => {
    const result = await followJobBoard({ userId, board: "https://boards.greenhouse.io/acme" });

    expect(result).toEqual({ ok: true, companyName: "Acme", active: 7 });
    expect(mocks.followBoard).toHaveBeenCalledWith({ userId, boardId: "board-1" });
  });

  it("follows a known board without fetching it again", async () => {
    mocks.findBoard.mockResolvedValue({ id: "board-9", companyName: "Acme", postingCount: 3 });

    const result = await followJobBoard({ userId, board: "jobs.lever.co/acme" });

    expect(result).toEqual({ ok: true, companyName: "Acme", active: 3 });
    expect(mocks.fetchSnapshot).not.toHaveBeenCalled();
  });

  it("rejects input it cannot read", async () => {
    expect((await followJobBoard({ userId, board: "acme" })).ok).toBe(false);
    expect(mocks.fetchSnapshot).not.toHaveBeenCalled();
  });

  it("enforces the follow limit before any network call", async () => {
    mocks.countFollows.mockResolvedValue(30);

    expect(await followJobBoard({ userId, board: "boards.greenhouse.io/acme" })).toMatchObject({ ok: false });
    expect(mocks.fetchSnapshot).not.toHaveBeenCalled();
  });

  it("explains a board that does not exist and stores nothing", async () => {
    mocks.fetchSnapshot.mockRejectedValue(new BoardFetchError("404", 404));

    const result = await followJobBoard({ userId, board: "boards.greenhouse.io/nope" });

    expect(result).toEqual({ ok: false, message: 'No public Greenhouse board called "nope" was found.' });
    expect(mocks.upsertBoard).not.toHaveBeenCalled();
  });
});

describe("runDailyDiscovery", () => {
  it("syncs due boards and purges old expired postings", async () => {
    mocks.listDueBoards.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    mocks.syncBoard.mockResolvedValueOnce({ ok: true, active: 1 }).mockResolvedValueOnce({ ok: false, error: "x" });
    mocks.purgeExpiredPostings.mockResolvedValue(4);

    const report = await runDailyDiscovery();

    expect(report).toEqual({ boards: 2, synced: 1, failed: 1, skipped: 0, purged: 4 });
  });

  it("stops starting new boards once the time budget is spent", async () => {
    let clock = 0;
    mocks.listDueBoards.mockResolvedValue(Array.from({ length: 10 }, (_, index) => ({ id: `b${index}` })));
    mocks.syncBoard.mockImplementation(async () => {
      clock += 250_000;
      return { ok: true, active: 1 };
    });

    const report = await runDailyDiscovery({ now: () => clock });

    expect(report.synced).toBe(1);
    expect(report.skipped).toBe(9);
  });

  it("seeds the built-in catalog before syncing", async () => {
    mocks.listDueBoards.mockResolvedValue([]);

    await runDailyDiscovery();

    expect(mocks.seedSystemBoards).toHaveBeenCalledWith(expect.arrayContaining([
      { source: "REMOTIVE", token: "all" },
      { source: "GREENHOUSE", token: "stripe" },
    ]));
  });

  it("filters only built-in boards nobody follows by everyone's target roles", async () => {
    mocks.listDueBoards.mockResolvedValue([
      { id: "system", system: true, followed: false },
      { id: "followed-system", system: true, followed: true },
      { id: "user", system: false, followed: true },
    ]);
    mocks.syncBoard.mockResolvedValue({ ok: true, active: 1 });

    await runDailyDiscovery();

    const matchers = Object.fromEntries(mocks.syncBoard.mock.calls.map(([board, , matcher]) => [board.id, matcher]));
    expect(matchers.system).toEqual([[["frontend", "front end"], ["engineer", "developer", "programmer"]]]);
    expect(matchers["followed-system"]).toBeNull();
    expect(matchers.user).toBeNull();
  });

  it("only re-checks sources that have not been checked recently when refreshing", async () => {
    mocks.listDueBoards.mockResolvedValue([]);

    await refreshDiscovery({ now: () => Date.parse("2026-11-15T12:00:00Z") });

    expect(mocks.listDueBoards).toHaveBeenCalledWith({ limit: 12, staleBefore: new Date("2026-11-15T06:00:00Z") });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findSuggestableBoard: vi.fn(),
  findBoardByPublicId: vi.fn(),
  countFollows: vi.fn(),
  followBoard: vi.fn(),
  findProfileByUser: vi.fn(),
  saveJobRegions: vi.fn(),
}));

vi.mock("@/features/discovery/server/suggestion.repository", () => ({
  findSuggestableBoard: mocks.findSuggestableBoard,
  findBoardByPublicId: mocks.findBoardByPublicId,
}));
vi.mock("@/features/discovery/server/board.repository", () => ({
  countFollows: mocks.countFollows,
  followBoard: mocks.followBoard,
}));
vi.mock("@/features/candidate-profile/server/profile.repository", () => ({
  findProfileByUser: mocks.findProfileByUser,
  saveJobRegions: mocks.saveJobRegions,
}));

const { followSuggestedBoard, nextRegions, setJobRegion } = await import(
  "@/features/discovery/server/suggestion.service"
);

const userId = "user-1";
const publicId = "3f0c0c84-1d5e-4b8f-9d0a-8d4b7f0c1a11";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findSuggestableBoard.mockResolvedValue({ id: "board-1", companyName: "Moniepoint", postingCount: 4 });
  mocks.countFollows.mockResolvedValue(0);
  mocks.findProfileByUser.mockResolvedValue({ jobRegions: [] });
});

describe("followSuggestedBoard", () => {
  it("follows a suggested company board", async () => {
    await expect(followSuggestedBoard({ userId, publicId })).resolves.toEqual({ ok: true, companyName: "Moniepoint" });
    expect(mocks.followBoard).toHaveBeenCalledWith({ userId, boardId: "board-1" });
  });

  it("refuses unknown or non-company boards", async () => {
    mocks.findSuggestableBoard.mockResolvedValue(null);

    await expect(followSuggestedBoard({ userId, publicId })).resolves.toMatchObject({ ok: false });
    expect(mocks.followBoard).not.toHaveBeenCalled();
  });

  it("respects the follow limit", async () => {
    mocks.countFollows.mockResolvedValue(30);

    await expect(followSuggestedBoard({ userId, publicId })).resolves.toEqual({
      ok: false,
      message: "You can follow up to 30 companies.",
    });
    expect(mocks.followBoard).not.toHaveBeenCalled();
  });
});

describe("job regions", () => {
  it("adds and removes a region without duplicates", () => {
    expect(nextRegions([], "NG", true)).toEqual(["NG"]);
    expect(nextRegions(["NG"], "NG", true)).toEqual(["NG"]);
    expect(nextRegions(["NG"], "NG", false)).toEqual([]);
  });

  it("saves the new list and drops unknown stored values", async () => {
    mocks.findProfileByUser.mockResolvedValue({ jobRegions: ["XX"] });

    await expect(setJobRegion({ userId, region: "NG", enabled: true })).resolves.toEqual(["NG"]);
    expect(mocks.saveJobRegions).toHaveBeenCalledWith({ userId, jobRegions: ["NG"] });
  });

  it("works before a career profile exists", async () => {
    mocks.findProfileByUser.mockResolvedValue(null);

    await expect(setJobRegion({ userId, region: "NG", enabled: false })).resolves.toEqual([]);
  });
});

describe("refollowBoard", () => {
  it("refollows any board by id, so Undo works for boards outside the catalog", async () => {
    const { refollowBoard } = await import("@/features/discovery/server/suggestion.service");
    mocks.findBoardByPublicId.mockResolvedValue({ id: "board-9", companyName: "Acme" });

    await expect(refollowBoard({ userId, publicId })).resolves.toEqual({ ok: true, companyName: "Acme" });
    expect(mocks.findSuggestableBoard).not.toHaveBeenCalled();
    expect(mocks.followBoard).toHaveBeenCalledWith({ userId, boardId: "board-9" });
  });
});

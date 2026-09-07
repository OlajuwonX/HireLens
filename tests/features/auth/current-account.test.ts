import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findUserById = vi.fn();

vi.mock("@/features/auth/server/user.repository", () => ({
  findUserById: (id: string) => findUserById(id),
}));

const { getAccountRecord } = await import(
  "@/features/auth/server/current-account"
);

const source = readFileSync(
  join(process.cwd(), "features", "auth", "server", "current-account.ts"),
  "utf8",
);

const record = {
  id: "8f1d0c22-0000-4000-8000-000000000001",
  email: "user@example.com",
  disabledAt: null,
  deletedAt: null,
};

beforeEach(() => {
  findUserById.mockReset();
  findUserById.mockResolvedValue(record);
});

describe("getAccountRecord", () => {
  it("returns the account row for the given user", async () => {
    await expect(getAccountRecord(record.id)).resolves.toEqual(record);
    expect(findUserById).toHaveBeenCalledWith(record.id);
  });

  it("looks up each user separately", async () => {
    const other = { ...record, id: "8f1d0c22-0000-4000-8000-000000000002" };

    findUserById.mockImplementation(async (id: string) =>
      id === record.id ? record : other,
    );

    await expect(getAccountRecord(record.id)).resolves.toEqual(record);
    await expect(getAccountRecord(other.id)).resolves.toEqual(other);
    expect(findUserById).toHaveBeenCalledTimes(2);
  });

  it("passes a missing account through as null", async () => {
    findUserById.mockResolvedValue(null);

    await expect(
      getAccountRecord("8f1d0c22-0000-4000-8000-000000000003"),
    ).resolves.toBeNull();
  });

  it("goes through React cache so one render pass reads the row once", () => {
    expect(source).toContain('from "react"');
    expect(source).toContain("cache(");
  });

  it("never caches across requests, so a disable takes effect immediately", () => {
    expect(source).not.toContain("unstable_cache");
    expect(source).not.toContain("revalidate");
    expect(source).not.toMatch(/\bnew Map\b|\bglobalThis\./);
  });
});

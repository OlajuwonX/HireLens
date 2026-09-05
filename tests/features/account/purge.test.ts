import { beforeEach, describe, expect, it, vi } from "vitest";

const listPurgeableAccounts = vi.fn();
const listStorageKeysForUser = vi.fn();
const isStillPurgeable = vi.fn();
const deletePurgeableAccount = vi.fn();
const deleteFile = vi.fn();

vi.mock("@/features/account/server/purge.repository", () => ({
  listPurgeableAccounts: (input: unknown) => listPurgeableAccounts(input),
  listStorageKeysForUser: (id: string) => listStorageKeysForUser(id),
  isStillPurgeable: (input: unknown) => isStillPurgeable(input),
  deletePurgeableAccount: (input: unknown) => deletePurgeableAccount(input),
}));

vi.mock("@/lib/storage/provider", () => ({
  getStorageProvider: () => storage,
}));

const storage = {
  uploadResume: vi.fn(),
  createReadUrl: vi.fn(),
  readFile: vi.fn(),
  deleteFile: (key: string) => deleteFile(key),
};

const { purgeExpiredAccounts } = await import(
  "@/features/account/server/purge.service"
);

const now = new Date("2026-10-02T03:00:00.000Z");

const candidate = {
  id: "7c31aa02-0000-4000-8000-000000000001",
  email: "ada@example.com",
  purgeAfter: new Date("2026-10-01T00:00:00.000Z"),
};

beforeEach(() => {
  for (const spy of [
    listPurgeableAccounts,
    listStorageKeysForUser,
    isStillPurgeable,
    deletePurgeableAccount,
    deleteFile,
  ]) {
    spy.mockReset();
  }

  listPurgeableAccounts.mockResolvedValue([candidate]);
  listStorageKeysForUser.mockResolvedValue([
    { storageKey: "resumes/a.pdf" },
    { storageKey: "documents/b.pdf" },
  ]);
  isStillPurgeable.mockResolvedValue(true);
  deletePurgeableAccount.mockResolvedValue({ id: candidate.id });
  deleteFile.mockResolvedValue(undefined);
});

describe("dry run", () => {
  it("deletes nothing at all", async () => {
    const report = await purgeExpiredAccounts({ dryRun: true, now });

    expect(report.entries[0].outcome).toBe("WOULD_PURGE");
    expect(deleteFile).not.toHaveBeenCalled();
    expect(deletePurgeableAccount).not.toHaveBeenCalled();
  });

  it("still reports what it would have removed", async () => {
    const report = await purgeExpiredAccounts({ dryRun: true, now });

    expect(report.eligible).toBe(1);
    expect(report.entries[0].objectCount).toBe(2);
    expect(report.purged).toBe(0);
  });
});

describe("a real purge", () => {
  it("deletes storage objects before the database row", async () => {
    const order: string[] = [];

    deleteFile.mockImplementation(async () => {
      order.push("storage");
    });
    deletePurgeableAccount.mockImplementation(async () => {
      order.push("database");
      return { id: candidate.id };
    });

    await purgeExpiredAccounts({ dryRun: false, now });

    expect(order).toEqual(["storage", "storage", "database"]);
  });

  it("removes every object the account owns", async () => {
    await purgeExpiredAccounts({ dryRun: false, now });

    expect(deleteFile).toHaveBeenCalledWith("resumes/a.pdf");
    expect(deleteFile).toHaveBeenCalledWith("documents/b.pdf");
  });

  it("reports the account as purged", async () => {
    const report = await purgeExpiredAccounts({ dryRun: false, now });

    expect(report.purged).toBe(1);
    expect(report.failed).toBe(0);
  });
});

describe("failure handling", () => {
  it("keeps the database row when storage deletion fails", async () => {
    deleteFile.mockRejectedValue(new Error("backblaze down"));

    const report = await purgeExpiredAccounts({ dryRun: false, now });

    expect(deletePurgeableAccount).not.toHaveBeenCalled();
    expect(report.entries[0].outcome).toBe("STORAGE_FAILED");
    expect(report.failed).toBe(1);
  });

  it("stops touching storage after the first failure", async () => {
    deleteFile.mockRejectedValue(new Error("backblaze down"));

    await purgeExpiredAccounts({ dryRun: false, now });

    expect(deleteFile).toHaveBeenCalledTimes(1);
  });

  it("does not report success when the database delete throws", async () => {
    deletePurgeableAccount.mockRejectedValue(new Error("pool gone"));

    const report = await purgeExpiredAccounts({ dryRun: false, now });

    expect(report.entries[0].outcome).toBe("DATABASE_FAILED");
    expect(report.purged).toBe(0);
  });

  it("treats an account with no files as purgeable", async () => {
    listStorageKeysForUser.mockResolvedValue([]);

    const report = await purgeExpiredAccounts({ dryRun: false, now });

    expect(deleteFile).not.toHaveBeenCalled();
    expect(report.purged).toBe(1);
  });
});

describe("restore beats purge", () => {
  it("skips an account restored before the run reaches it", async () => {
    isStillPurgeable.mockResolvedValue(false);

    const report = await purgeExpiredAccounts({ dryRun: false, now });

    expect(deleteFile).not.toHaveBeenCalled();
    expect(deletePurgeableAccount).not.toHaveBeenCalled();
    expect(report.entries[0].outcome).toBe("RESTORED_BEFORE_PURGE");
  });

  it("treats a no-op delete as a restore rather than a success", async () => {
    deletePurgeableAccount.mockResolvedValue(null);

    const report = await purgeExpiredAccounts({ dryRun: false, now });

    expect(report.entries[0].outcome).toBe("RESTORED_BEFORE_PURGE");
    expect(report.purged).toBe(0);
  });
});

describe("batching", () => {
  it("asks for a bounded batch", async () => {
    await purgeExpiredAccounts({ dryRun: true, now, limit: 5 });

    expect(listPurgeableAccounts).toHaveBeenCalledWith({
      before: now,
      limit: 5,
    });
  });

  it("only considers accounts whose deadline has passed", async () => {
    await purgeExpiredAccounts({ dryRun: true, now });

    const [input] = listPurgeableAccounts.mock.calls[0];

    expect(input.before).toBe(now);
    expect(input.limit).toBeGreaterThan(0);
  });

  it("handles an empty run", async () => {
    listPurgeableAccounts.mockResolvedValue([]);

    const report = await purgeExpiredAccounts({ dryRun: false, now });

    expect(report).toMatchObject({ eligible: 0, purged: 0, failed: 0 });
  });
});

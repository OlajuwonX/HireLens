import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const getAccountRecord = vi.fn();
const findOrCreateUserFromPublicProfile = vi.fn();

class RedirectError extends Error {
  constructor(public readonly target: string) {
    super(`NEXT_REDIRECT:${target}`);
  }
}

vi.mock("@/auth", () => ({ auth: () => auth() }));

vi.mock("next/navigation", () => ({
  redirect: (target: string) => {
    throw new RedirectError(target);
  },
}));

vi.mock("@/features/auth/server/current-account", () => ({
  getAccountRecord: (id: string) => getAccountRecord(id),
}));

vi.mock("@/features/auth/server/user.service", () => ({
  findOrCreateUserFromPublicProfile: (profile: unknown) =>
    findOrCreateUserFromPublicProfile(profile),
}));

vi.mock("@/features/auth/server/require-user", () => ({
  requireCurrentUser: async () => ({
    user: { name: "Ada", email: "ada@example.com", image: null },
  }),
}));

const { requireDatabaseUser } = await import(
  "@/features/auth/server/require-database-user"
);

const userId = "3a7c1d90-0000-4000-8000-000000000001";

const activeRecord = {
  id: userId,
  name: "Ada",
  email: "ada@example.com",
  disabledAt: null,
  deletedAt: null,
};

async function redirectTargetOf(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    if (error instanceof RedirectError) {
      return error.target;
    }

    throw error;
  }

  return null;
}

beforeEach(() => {
  auth.mockReset();
  getAccountRecord.mockReset();
  findOrCreateUserFromPublicProfile.mockReset();

  auth.mockResolvedValue({
    user: { name: "Ada", email: "ada@example.com" },
    dbUserId: userId,
  });
  getAccountRecord.mockResolvedValue(activeRecord);
});

describe("requireDatabaseUser", () => {
  it("lets an active account through", async () => {
    await expect(requireDatabaseUser()).resolves.toEqual({
      id: userId,
      name: "Ada",
      email: "ada@example.com",
    });
  });

  it("sends a request with no session to sign-in", async () => {
    auth.mockResolvedValue(null);

    expect(await redirectTargetOf(requireDatabaseUser)).toBe("/sign-in");
  });

  it("sends a disabled account to the paused page", async () => {
    getAccountRecord.mockResolvedValue({
      ...activeRecord,
      disabledAt: new Date(),
    });

    expect(await redirectTargetOf(requireDatabaseUser)).toBe("/account/paused");
  });

  it("sends a deletion-pending account to the scheduled page", async () => {
    getAccountRecord.mockResolvedValue({
      ...activeRecord,
      deletedAt: new Date(),
    });

    expect(await redirectTargetOf(requireDatabaseUser)).toBe(
      "/account/scheduled",
    );
  });

  it("prefers the scheduled page when an account is both disabled and deleted", async () => {
    getAccountRecord.mockResolvedValue({
      ...activeRecord,
      disabledAt: new Date(),
      deletedAt: new Date(),
    });

    expect(await redirectTargetOf(requireDatabaseUser)).toBe(
      "/account/scheduled",
    );
  });

  it("sends a purged account with a live token to sign-in", async () => {
    getAccountRecord.mockResolvedValue(null);

    expect(await redirectTargetOf(requireDatabaseUser)).toBe("/sign-in");
  });

  it("never trusts the session alone as proof the account is usable", async () => {
    getAccountRecord.mockResolvedValue({
      ...activeRecord,
      deletedAt: new Date(),
    });

    await redirectTargetOf(requireDatabaseUser);

    expect(getAccountRecord).toHaveBeenCalledWith(userId);
  });

  it("resolves the account when the token carries no database id", async () => {
    auth.mockResolvedValue({ user: { email: "ada@example.com" } });
    findOrCreateUserFromPublicProfile.mockResolvedValue(activeRecord);

    await expect(requireDatabaseUser()).resolves.toMatchObject({ id: userId });
    expect(findOrCreateUserFromPublicProfile).toHaveBeenCalled();
  });

  it("still checks state on the token-without-id path", async () => {
    auth.mockResolvedValue({ user: { email: "ada@example.com" } });
    findOrCreateUserFromPublicProfile.mockResolvedValue(activeRecord);
    getAccountRecord.mockResolvedValue({
      ...activeRecord,
      disabledAt: new Date(),
    });

    expect(await redirectTargetOf(requireDatabaseUser)).toBe("/account/paused");
  });
});

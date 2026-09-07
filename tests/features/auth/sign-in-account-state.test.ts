import { beforeEach, describe, expect, it, vi } from "vitest";

const findUserByEmail = vi.fn();
const createUser = vi.fn();
const touchUserLogin = vi.fn();
const upsertOAuthAccount = vi.fn();
const markEmailVerified = vi.fn();
const verifyPassword = vi.fn();

vi.mock("@/features/auth/server/user.repository", () => ({
  findUserByEmail: (email: string) => findUserByEmail(email),
  createUser: (input: unknown) => createUser(input),
  touchUserLogin: (input: unknown) => touchUserLogin(input),
  upsertOAuthAccount: (input: unknown) => upsertOAuthAccount(input),
  markEmailVerified: (input: unknown) => markEmailVerified(input),
  setUserPasswordHash: vi.fn(),
  findUserById: vi.fn(),
}));

vi.mock("@/features/auth/server/password", () => ({
  hashPassword: async () => "$2a$12$hash",
  verifyPassword: (password: string, hash: string) =>
    verifyPassword(password, hash),
}));

const { recordSignIn, verifyCredentials } = await import(
  "@/features/auth/server/user.service"
);

const base = {
  id: "5c2b7e10-0000-4000-8000-000000000001",
  name: "Ada",
  email: "ada@example.com",
  passwordHash: "$2a$12$hash",
  emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
  disabledAt: null as Date | null,
  deletedAt: null as Date | null,
};

const disabled = { ...base, disabledAt: new Date() };
const pendingDeletion = { ...base, deletedAt: new Date() };

const googleInput = {
  profile: { name: "Ada", email: "ada@example.com", image: null },
  provider: "google",
  providerAccountId: "google-123",
  emailVerified: true,
};

beforeEach(() => {
  for (const spy of [
    findUserByEmail,
    createUser,
    touchUserLogin,
    upsertOAuthAccount,
    markEmailVerified,
    verifyPassword,
  ]) {
    spy.mockReset();
  }

  verifyPassword.mockResolvedValue(true);
  touchUserLogin.mockImplementation(async () => base);
});

describe("Google sign-in", () => {
  it("records a normal sign-in for an active account", async () => {
    findUserByEmail.mockResolvedValue(base);

    await recordSignIn(googleInput);

    expect(upsertOAuthAccount).toHaveBeenCalled();
    expect(touchUserLogin).toHaveBeenCalled();
  });

  it("does not touch a disabled account", async () => {
    findUserByEmail.mockResolvedValue(disabled);

    await expect(recordSignIn(googleInput)).resolves.toEqual(disabled);

    expect(touchUserLogin).not.toHaveBeenCalled();
    expect(upsertOAuthAccount).not.toHaveBeenCalled();
    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it("does not touch an account that is pending deletion", async () => {
    findUserByEmail.mockResolvedValue(pendingDeletion);

    await expect(recordSignIn(googleInput)).resolves.toEqual(pendingDeletion);

    expect(touchUserLogin).not.toHaveBeenCalled();
    expect(upsertOAuthAccount).not.toHaveBeenCalled();
    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it("never clears the lifecycle timestamps on sign-in", async () => {
    findUserByEmail.mockResolvedValue(pendingDeletion);

    const user = await recordSignIn(googleInput);

    expect(user.deletedAt).toEqual(pendingDeletion.deletedAt);
  });

  it("still resolves identity so the account can reach its recovery page", async () => {
    findUserByEmail.mockResolvedValue(pendingDeletion);

    await expect(recordSignIn(googleInput)).resolves.toMatchObject({
      id: base.id,
    });
  });
});

describe("credentials sign-in", () => {
  it("signs in an active account and records the login", async () => {
    findUserByEmail.mockResolvedValue(base);

    await expect(
      verifyCredentials({ email: base.email, password: "pw" }),
    ).resolves.toMatchObject({ id: base.id });
    expect(touchUserLogin).toHaveBeenCalled();
  });

  it("rejects a wrong password whatever the account state", async () => {
    verifyPassword.mockResolvedValue(false);
    findUserByEmail.mockResolvedValue(base);

    await expect(
      verifyCredentials({ email: base.email, password: "wrong" }),
    ).resolves.toBeNull();
  });

  it("lets a disabled account authenticate so it can be reactivated", async () => {
    findUserByEmail.mockResolvedValue(disabled);

    await expect(
      verifyCredentials({ email: base.email, password: "pw" }),
    ).resolves.toMatchObject({ id: base.id });
    expect(touchUserLogin).not.toHaveBeenCalled();
  });

  it("lets a deletion-pending account authenticate so it can be restored", async () => {
    findUserByEmail.mockResolvedValue(pendingDeletion);

    await expect(
      verifyCredentials({ email: base.email, password: "pw" }),
    ).resolves.toMatchObject({ id: base.id });
    expect(touchUserLogin).not.toHaveBeenCalled();
  });

  it("refuses an account with no password at all", async () => {
    findUserByEmail.mockResolvedValue({ ...base, passwordHash: null });

    await expect(
      verifyCredentials({ email: base.email, password: "pw" }),
    ).resolves.toBeNull();
  });
});

describe("both providers agree", () => {
  it("treats disabled and deletion-pending the same way on either path", async () => {
    for (const record of [disabled, pendingDeletion]) {
      findUserByEmail.mockResolvedValue(record);
      touchUserLogin.mockClear();

      const viaGoogle = await recordSignIn(googleInput);
      const viaPassword = await verifyCredentials({
        email: base.email,
        password: "pw",
      });

      expect(viaGoogle?.id).toBe(record.id);
      expect(viaPassword?.id).toBe(record.id);
      expect(touchUserLogin).not.toHaveBeenCalled();
    }
  });
});

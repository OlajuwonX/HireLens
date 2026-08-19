import { beforeEach, describe, expect, it, vi } from "vitest";

const findUserByEmail = vi.fn();
const createUser = vi.fn();
const setUserPasswordHash = vi.fn();

vi.mock("@/features/auth/server/user.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/auth/server/user.repository")
  >("@/features/auth/server/user.repository");

  return {
    ...actual,
    findUserByEmail: (email: string) => findUserByEmail(email),
    createUser: (input: unknown) => createUser(input),
    setUserPasswordHash: (input: unknown) => setUserPasswordHash(input),
  };
});

const { registerCredentialsUser } = await import(
  "@/features/auth/server/user.service"
);

const SIGN_UP = {
  name: "Ada",
  email: "Ada@Example.com",
  password: "Str0ngPassword",
};

beforeEach(() => {
  findUserByEmail.mockReset();
  createUser.mockReset();
  setUserPasswordHash.mockReset();
});

describe("registerCredentialsUser", () => {
  it("creates an account when the email is free", async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue({ id: "user-1" });

    const result = await registerCredentialsUser(SIGN_UP);

    expect(result.ok).toBe(true);
    expect(createUser).toHaveBeenCalledTimes(1);
    expect(findUserByEmail).toHaveBeenCalledWith("ada@example.com");
  });

  it("stores a hash rather than the password itself", async () => {
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue({ id: "user-1" });

    await registerCredentialsUser(SIGN_UP);

    const created = createUser.mock.calls[0][0] as { passwordHash: string };

    expect(created.passwordHash).not.toContain(SIGN_UP.password);
    expect(created.passwordHash.startsWith("$2")).toBe(true);
  });

  it("refuses an email that already has a password", async () => {
    findUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "$2a$12$existing",
      emailVerifiedAt: null,
      deletedAt: null,
    });

    const result = await registerCredentialsUser(SIGN_UP);

    expect(result).toEqual({
      ok: false,
      message: "An account with that email already exists. Sign in instead.",
    });
    expect(createUser).not.toHaveBeenCalled();
  });

  it("never attaches a password to an existing Google-only account", async () => {
    findUserByEmail.mockResolvedValue({
      id: "victim",
      passwordHash: null,
      emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
      deletedAt: null,
    });

    const result = await registerCredentialsUser(SIGN_UP);

    expect(result.ok).toBe(false);
    expect(setUserPasswordHash).not.toHaveBeenCalled();
    expect(createUser).not.toHaveBeenCalled();
  });

  it("gives the same answer whether or not the account has a password", async () => {
    findUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "$2a$12$existing",
      emailVerifiedAt: null,
      deletedAt: null,
    });
    const withPassword = await registerCredentialsUser(SIGN_UP);

    findUserByEmail.mockResolvedValue({
      id: "user-2",
      passwordHash: null,
      emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
      deletedAt: null,
    });
    const googleOnly = await registerCredentialsUser(SIGN_UP);

    expect(googleOnly).toEqual(withPassword);
  });

  it("does no hashing work when the email is taken", async () => {
    findUserByEmail.mockResolvedValue({
      id: "user-1",
      passwordHash: "$2a$12$existing",
      emailVerifiedAt: null,
      deletedAt: null,
    });

    const startedAt = performance.now();
    await registerCredentialsUser(SIGN_UP);

    expect(performance.now() - startedAt).toBeLessThan(100);
  });
});

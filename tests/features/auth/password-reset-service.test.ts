import { beforeEach, describe, expect, it, vi } from "vitest";

const findUserByEmail = vi.fn();
const setUserPasswordHash = vi.fn();
const markEmailVerified = vi.fn();
const createVerificationToken = vi.fn();
const findVerificationTokenByHash = vi.fn();
const deleteVerificationToken = vi.fn();
const deleteExpiredVerificationTokens = vi.fn();
const hasVerificationTokenExpiringAfter = vi.fn();
const sendEmail = vi.fn();

vi.mock("@/features/auth/server/user.repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/auth/server/user.repository")
  >("@/features/auth/server/user.repository");

  return {
    ...actual,
    findUserByEmail: (email: string) => findUserByEmail(email),
    setUserPasswordHash: (input: unknown) => setUserPasswordHash(input),
    markEmailVerified: (input: unknown) => markEmailVerified(input),
  };
});

vi.mock("@/features/auth/server/verification-token.repository", () => ({
  createVerificationToken: (input: unknown) => createVerificationToken(input),
  findVerificationTokenByHash: (hash: string) =>
    findVerificationTokenByHash(hash),
  deleteVerificationToken: (hash: string) => deleteVerificationToken(hash),
  deleteExpiredVerificationTokens: (identifier: string) =>
    deleteExpiredVerificationTokens(identifier),
  hasVerificationTokenExpiringAfter: (input: unknown) =>
    hasVerificationTokenExpiringAfter(input),
}));

vi.mock("@/lib/email/brevo", () => ({
  isEmailEnabled: () => true,
  sendEmail: (input: unknown) => sendEmail(input),
}));

const { completePasswordReset, isResetTokenUsable, requestPasswordReset } =
  await import("@/features/auth/server/password-reset.service");

const CREDENTIALS_USER = {
  id: "user-1",
  email: "ada@example.com",
  passwordHash: "$2a$12$existing",
  emailVerifiedAt: null,
  deletedAt: null,
};

const future = () => new Date(Date.now() + 60_000);

beforeEach(() => {
  for (const mock of [
    findUserByEmail,
    setUserPasswordHash,
    markEmailVerified,
    createVerificationToken,
    findVerificationTokenByHash,
    deleteVerificationToken,
    deleteExpiredVerificationTokens,
    hasVerificationTokenExpiringAfter,
    sendEmail,
  ]) {
    mock.mockReset();
  }

  hasVerificationTokenExpiringAfter.mockResolvedValue(false);
  sendEmail.mockResolvedValue(true);
});

describe("requestPasswordReset", () => {
  it("emails a link to an account that has a password", async () => {
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    await requestPasswordReset("Ada@Example.com");

    expect(createVerificationToken).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail.mock.calls[0][0].to).toBe("ada@example.com");
  });

  it("files the token under the reset purpose", async () => {
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    await requestPasswordReset("ada@example.com");

    const stored = createVerificationToken.mock.calls[0][0] as {
      identifier: string;
      tokenHash: string;
    };

    expect(stored.identifier).toBe("reset:ada@example.com");
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("keeps the raw token out of the stored row", async () => {
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    await requestPasswordReset("ada@example.com");

    const stored = createVerificationToken.mock.calls[0][0] as {
      tokenHash: string;
    };
    const html = sendEmail.mock.calls[0][0].html as string;

    expect(html).not.toContain(stored.tokenHash);
  });

  it("sends nothing for a Google-only account", async () => {
    findUserByEmail.mockResolvedValue({
      ...CREDENTIALS_USER,
      passwordHash: null,
    });

    await requestPasswordReset("ada@example.com");

    expect(createVerificationToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends nothing for an unknown address", async () => {
    findUserByEmail.mockResolvedValue(null);

    await requestPasswordReset("nobody@example.com");

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends nothing for a deleted account", async () => {
    findUserByEmail.mockResolvedValue({
      ...CREDENTIALS_USER,
      deletedAt: new Date(),
    });

    await requestPasswordReset("ada@example.com");

    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("refuses a second link while an earlier one is still fresh", async () => {
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);
    hasVerificationTokenExpiringAfter.mockResolvedValue(true);

    await requestPasswordReset("ada@example.com");

    expect(createVerificationToken).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("a confirmation token is not a reset token", () => {
  it("refuses to reset a password with a verify token", async () => {
    findVerificationTokenByHash.mockResolvedValue({
      identifier: "verify:ada@example.com",
      tokenHash: "hash",
      expiresAt: future(),
    });
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    const result = await completePasswordReset({
      token: "raw-token",
      password: "Str0ngPassword",
    });

    expect(result.ok).toBe(false);
    expect(setUserPasswordHash).not.toHaveBeenCalled();
  });

  it("does not treat a verify token as a usable reset link", async () => {
    findVerificationTokenByHash.mockResolvedValue({
      identifier: "verify:ada@example.com",
      tokenHash: "hash",
      expiresAt: future(),
    });

    expect(await isResetTokenUsable("raw-token")).toBe(false);
  });

  it("refuses a legacy row stored without a purpose", async () => {
    findVerificationTokenByHash.mockResolvedValue({
      identifier: "ada@example.com",
      tokenHash: "hash",
      expiresAt: future(),
    });

    const result = await completePasswordReset({
      token: "raw-token",
      password: "Str0ngPassword",
    });

    expect(result.ok).toBe(false);
    expect(setUserPasswordHash).not.toHaveBeenCalled();
  });
});

describe("completePasswordReset", () => {
  const resetRow = () => ({
    identifier: "reset:ada@example.com",
    tokenHash: "hash",
    expiresAt: future(),
  });

  it("sets the new password and burns the token", async () => {
    findVerificationTokenByHash.mockResolvedValue(resetRow());
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    const result = await completePasswordReset({
      token: "raw-token",
      password: "Str0ngPassword",
    });

    expect(result.ok).toBe(true);
    expect(setUserPasswordHash).toHaveBeenCalledTimes(1);
    expect(deleteVerificationToken).toHaveBeenCalledTimes(1);
  });

  it("looks the user up by the address inside the token", async () => {
    findVerificationTokenByHash.mockResolvedValue(resetRow());
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    await completePasswordReset({
      token: "raw-token",
      password: "Str0ngPassword",
    });

    expect(findUserByEmail).toHaveBeenCalledWith("ada@example.com");
  });

  it("treats a completed reset as proof of the address", async () => {
    findVerificationTokenByHash.mockResolvedValue(resetRow());
    findUserByEmail.mockResolvedValue(CREDENTIALS_USER);

    await completePasswordReset({
      token: "raw-token",
      password: "Str0ngPassword",
    });

    expect(markEmailVerified).toHaveBeenCalledWith({ userId: "user-1" });
  });

  it("leaves an already verified account alone", async () => {
    findVerificationTokenByHash.mockResolvedValue(resetRow());
    findUserByEmail.mockResolvedValue({
      ...CREDENTIALS_USER,
      emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
    });

    await completePasswordReset({
      token: "raw-token",
      password: "Str0ngPassword",
    });

    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it("rejects an expired token without touching the password", async () => {
    findVerificationTokenByHash.mockResolvedValue({
      identifier: "reset:ada@example.com",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await completePasswordReset({
      token: "raw-token",
      password: "Str0ngPassword",
    });

    expect(result).toEqual({
      ok: false,
      message: "That reset link has expired. Request a new one.",
    });
    expect(setUserPasswordHash).not.toHaveBeenCalled();
  });

  it("rejects an unknown token", async () => {
    findVerificationTokenByHash.mockResolvedValue(null);

    const result = await completePasswordReset({
      token: "made-up",
      password: "Str0ngPassword",
    });

    expect(result.ok).toBe(false);
    expect(setUserPasswordHash).not.toHaveBeenCalled();
  });
});

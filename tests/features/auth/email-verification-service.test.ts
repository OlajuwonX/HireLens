import { beforeEach, describe, expect, it, vi } from "vitest";

const findUserByEmail = vi.fn();
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

const { completeEmailVerification, requestEmailVerification } = await import(
  "@/features/auth/server/email-verification.service"
);

const UNVERIFIED_USER = {
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

describe("requestEmailVerification", () => {
  it("emails a confirmation link to an unverified account", async () => {
    findUserByEmail.mockResolvedValue(UNVERIFIED_USER);

    const result = await requestEmailVerification("Ada@Example.com");

    expect(result.ok).toBe(true);
    expect(sendEmail.mock.calls[0][0].to).toBe("ada@example.com");
  });

  it("files the token under the verify purpose", async () => {
    findUserByEmail.mockResolvedValue(UNVERIFIED_USER);

    await requestEmailVerification("ada@example.com");

    const stored = createVerificationToken.mock.calls[0][0] as {
      identifier: string;
    };

    expect(stored.identifier).toBe("verify:ada@example.com");
  });

  it("points the link at the confirmation route", async () => {
    findUserByEmail.mockResolvedValue(UNVERIFIED_USER);

    await requestEmailVerification("ada@example.com");

    expect(sendEmail.mock.calls[0][0].html).toContain("/verify-email?token=");
  });

  it("says nothing to do when the address is already confirmed", async () => {
    findUserByEmail.mockResolvedValue({
      ...UNVERIFIED_USER,
      emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
    });

    const result = await requestEmailVerification("ada@example.com");

    expect(result.ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("does not send a second link during the cooldown", async () => {
    findUserByEmail.mockResolvedValue(UNVERIFIED_USER);
    hasVerificationTokenExpiringAfter.mockResolvedValue(true);

    const result = await requestEmailVerification("ada@example.com");

    expect(result.ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reports a failed send rather than claiming success", async () => {
    findUserByEmail.mockResolvedValue(UNVERIFIED_USER);
    sendEmail.mockResolvedValue(false);

    const result = await requestEmailVerification("ada@example.com");

    expect(result.ok).toBe(false);
  });
});

describe("completeEmailVerification", () => {
  const verifyRow = () => ({
    identifier: "verify:ada@example.com",
    tokenHash: "hash",
    expiresAt: future(),
  });

  it("stamps the address and burns the token", async () => {
    findVerificationTokenByHash.mockResolvedValue(verifyRow());
    findUserByEmail.mockResolvedValue(UNVERIFIED_USER);

    const result = await completeEmailVerification("raw-token");

    expect(result.ok).toBe(true);
    expect(markEmailVerified).toHaveBeenCalledWith({ userId: "user-1" });
    expect(deleteVerificationToken).toHaveBeenCalledTimes(1);
  });

  it("never clears the password it is meant to protect", async () => {
    findVerificationTokenByHash.mockResolvedValue(verifyRow());
    findUserByEmail.mockResolvedValue(UNVERIFIED_USER);

    await completeEmailVerification("raw-token");

    expect(markEmailVerified).toHaveBeenCalledWith(
      expect.not.objectContaining({ clearPasswordHash: true }),
    );
  });

  it("refuses a reset token", async () => {
    findVerificationTokenByHash.mockResolvedValue({
      identifier: "reset:ada@example.com",
      tokenHash: "hash",
      expiresAt: future(),
    });

    const result = await completeEmailVerification("raw-token");

    expect(result.ok).toBe(false);
    expect(markEmailVerified).not.toHaveBeenCalled();
  });

  it("refuses an expired token", async () => {
    findVerificationTokenByHash.mockResolvedValue({
      identifier: "verify:ada@example.com",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await completeEmailVerification("raw-token");

    expect(result.ok).toBe(false);
    expect(markEmailVerified).not.toHaveBeenCalled();
  });
});

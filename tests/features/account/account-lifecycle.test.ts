import { beforeEach, describe, expect, it, vi } from "vitest";

const findAccountForUser = vi.fn();
const setAccountDisabled = vi.fn();
const setAccountDeletion = vi.fn();
const sendAccountDisabledEmail = vi.fn();
const sendAccountReactivatedEmail = vi.fn();
const sendDeletionRequestedEmail = vi.fn();
const sendDeletionRestoredEmail = vi.fn();

vi.mock("@/features/account/server/account.repository", () => ({
  findAccountForUser: (id: string) => findAccountForUser(id),
  setAccountDisabled: (input: unknown) => setAccountDisabled(input),
  setAccountDeletion: (input: unknown) => setAccountDeletion(input),
}));

vi.mock("@/features/account/server/account-email.service", () => ({
  sendAccountDisabledEmail: (to: string) => sendAccountDisabledEmail(to),
  sendAccountReactivatedEmail: (to: string) => sendAccountReactivatedEmail(to),
  sendDeletionRequestedEmail: (input: unknown) => sendDeletionRequestedEmail(input),
  sendDeletionRestoredEmail: (to: string) => sendDeletionRestoredEmail(to),
}));

const {
  disableAccount,
  reactivateAccount,
  getAccountOverview,
  requestAccountDeletion,
  restoreAccount,
} = await import("@/features/account/server/account.service");

const { DELETION_GRACE_DAYS } = await import("@/features/account/constants");

const userId = "0b9d51a4-0000-4000-8000-000000000001";

const active = {
  id: userId,
  name: "Ada",
  email: "ada@example.com",
  disabledAt: null as Date | null,
  deletedAt: null as Date | null,
  purgeAfter: null as Date | null,
};

const disabled = { ...active, disabledAt: new Date("2026-09-01T00:00:00Z") };
const pendingDeletion = {
  ...active,
  deletedAt: new Date("2026-09-01T00:00:00Z"),
  purgeAfter: new Date("2026-10-01T00:00:00Z"),
};

beforeEach(() => {
  for (const spy of [
    findAccountForUser,
    setAccountDisabled,
    sendAccountDisabledEmail,
    sendAccountReactivatedEmail,
    setAccountDeletion,
    sendDeletionRequestedEmail,
    sendDeletionRestoredEmail,
  ]) {
    spy.mockReset();
  }

  sendAccountDisabledEmail.mockResolvedValue(true);
  sendAccountReactivatedEmail.mockResolvedValue(true);
  sendDeletionRequestedEmail.mockResolvedValue(true);
  sendDeletionRestoredEmail.mockResolvedValue(true);
});

describe("disableAccount", () => {
  it("pauses an active account and tells the user", async () => {
    findAccountForUser.mockResolvedValue(active);
    setAccountDisabled.mockResolvedValue(disabled);

    await expect(disableAccount(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDisabled).toHaveBeenCalledWith(
      expect.objectContaining({ userId, disabledAt: expect.any(Date) }),
    );
    expect(sendAccountDisabledEmail).toHaveBeenCalledWith(active.email);
  });

  it("is idempotent when the account is already paused", async () => {
    findAccountForUser.mockResolvedValue(disabled);

    await expect(disableAccount(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDisabled).not.toHaveBeenCalled();
    expect(sendAccountDisabledEmail).not.toHaveBeenCalled();
  });

  it("refuses to pause an account that is scheduled for deletion", async () => {
    findAccountForUser.mockResolvedValue(pendingDeletion);

    const result = await disableAccount(userId);

    expect(result.ok).toBe(false);
    expect(setAccountDisabled).not.toHaveBeenCalled();
  });

  it("never touches the deletion fields", async () => {
    findAccountForUser.mockResolvedValue(active);
    setAccountDisabled.mockResolvedValue(disabled);

    await disableAccount(userId);

    const [input] = setAccountDisabled.mock.calls[0];

    expect(input).not.toHaveProperty("deletedAt");
    expect(input).not.toHaveProperty("purgeAfter");
  });

  it("still succeeds when the email cannot be sent", async () => {
    findAccountForUser.mockResolvedValue(active);
    setAccountDisabled.mockResolvedValue(disabled);
    sendAccountDisabledEmail.mockRejectedValue(new Error("brevo down"));

    await expect(disableAccount(userId)).resolves.toEqual({ ok: true });
  });

  it("reports a missing account rather than throwing", async () => {
    findAccountForUser.mockResolvedValue(null);

    expect((await disableAccount(userId)).ok).toBe(false);
  });
});

describe("reactivateAccount", () => {
  it("clears the pause and tells the user", async () => {
    findAccountForUser.mockResolvedValue(disabled);
    setAccountDisabled.mockResolvedValue(active);

    await expect(reactivateAccount(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDisabled).toHaveBeenCalledWith({
      userId,
      disabledAt: null,
    });
    expect(sendAccountReactivatedEmail).toHaveBeenCalledWith(active.email);
  });

  it("is idempotent when the account is already active", async () => {
    findAccountForUser.mockResolvedValue(active);

    await expect(reactivateAccount(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDisabled).not.toHaveBeenCalled();
    expect(sendAccountReactivatedEmail).not.toHaveBeenCalled();
  });

  it("refuses to reactivate an account that is scheduled for deletion", async () => {
    findAccountForUser.mockResolvedValue(pendingDeletion);

    const result = await reactivateAccount(userId);

    expect(result.ok).toBe(false);
    expect(setAccountDisabled).not.toHaveBeenCalled();
  });

  it("still succeeds when the email cannot be sent", async () => {
    findAccountForUser.mockResolvedValue(disabled);
    setAccountDisabled.mockResolvedValue(active);
    sendAccountReactivatedEmail.mockRejectedValue(new Error("brevo down"));

    await expect(reactivateAccount(userId)).resolves.toEqual({ ok: true });
  });
});

describe("getAccountOverview", () => {
  it("reports the resolved state alongside the row", async () => {
    findAccountForUser.mockResolvedValue(disabled);

    await expect(getAccountOverview(userId)).resolves.toMatchObject({
      state: "DISABLED",
    });
  });

  it("returns null when there is no account", async () => {
    findAccountForUser.mockResolvedValue(null);

    await expect(getAccountOverview(userId)).resolves.toBeNull();
  });
});

describe("requestAccountDeletion", () => {
  it("sets a purge date 30 days out and tells the user", async () => {
    findAccountForUser.mockResolvedValue(active);
    setAccountDeletion.mockImplementation(async (input) => ({
      ...active,
      deletedAt: input.deletedAt,
      purgeAfter: input.purgeAfter,
    }));

    await expect(requestAccountDeletion(userId)).resolves.toEqual({ ok: true });

    const [input] = setAccountDeletion.mock.calls[0];
    const gap = input.purgeAfter.getTime() - input.deletedAt.getTime();

    expect(Math.round(gap / (24 * 60 * 60 * 1000))).toBe(DELETION_GRACE_DAYS);
    expect(sendDeletionRequestedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: active.email }),
    );
  });

  it("clears any pause so the two states cannot both be set", async () => {
    findAccountForUser.mockResolvedValue(disabled);
    setAccountDeletion.mockResolvedValue({
      ...pendingDeletion,
    });

    await requestAccountDeletion(userId);

    expect(setAccountDeletion).toHaveBeenCalled();
  });

  it("is idempotent when deletion was already requested", async () => {
    findAccountForUser.mockResolvedValue(pendingDeletion);

    await expect(requestAccountDeletion(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDeletion).not.toHaveBeenCalled();
    expect(sendDeletionRequestedEmail).not.toHaveBeenCalled();
  });

  it("still succeeds when the email cannot be sent", async () => {
    findAccountForUser.mockResolvedValue(active);
    setAccountDeletion.mockResolvedValue(pendingDeletion);
    sendDeletionRequestedEmail.mockRejectedValue(new Error("brevo down"));

    await expect(requestAccountDeletion(userId)).resolves.toEqual({ ok: true });
  });

  it("reports a missing account rather than throwing", async () => {
    findAccountForUser.mockResolvedValue(null);

    expect((await requestAccountDeletion(userId)).ok).toBe(false);
  });
});

describe("restoreAccount", () => {
  it("clears both deletion fields and tells the user", async () => {
    findAccountForUser.mockResolvedValue(pendingDeletion);
    setAccountDeletion.mockResolvedValue(active);

    await expect(restoreAccount(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDeletion).toHaveBeenCalledWith({
      userId,
      deletedAt: null,
      purgeAfter: null,
    });
    expect(sendDeletionRestoredEmail).toHaveBeenCalledWith(active.email);
  });

  it("is idempotent when the account was never scheduled", async () => {
    findAccountForUser.mockResolvedValue(active);

    await expect(restoreAccount(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDeletion).not.toHaveBeenCalled();
    expect(sendDeletionRestoredEmail).not.toHaveBeenCalled();
  });

  it("survives being called twice", async () => {
    findAccountForUser.mockResolvedValueOnce(pendingDeletion);
    setAccountDeletion.mockResolvedValue(active);
    await restoreAccount(userId);

    findAccountForUser.mockResolvedValueOnce(active);
    await expect(restoreAccount(userId)).resolves.toEqual({ ok: true });

    expect(setAccountDeletion).toHaveBeenCalledTimes(1);
  });
});

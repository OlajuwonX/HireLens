import "server-only";

import * as Sentry from "@sentry/nextjs";
import { resolveAccountState } from "@/features/auth/account-state";
import { purgeDateFrom } from "../constants";
import {
  sendAccountDisabledEmail,
  sendAccountReactivatedEmail,
  sendDeletionRequestedEmail,
  sendDeletionRestoredEmail,
} from "./account-email.service";
import {
  findAccountForUser,
  setAccountDeletion,
  setAccountDisabled,
} from "./account.repository";

export type AccountActionResult =
  | { ok: true }
  | { ok: false; message: string };

const GONE = "That account is no longer available.";

async function notify(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    Sentry.captureException(error, { tags: { source: "account-lifecycle" } });
  }
}

export async function getAccountOverview(userId: string) {
  const account = await findAccountForUser(userId);

  if (!account) {
    return null;
  }

  return { ...account, state: resolveAccountState(account) };
}

export async function disableAccount(
  userId: string,
): Promise<AccountActionResult> {
  const account = await findAccountForUser(userId);

  if (!account) {
    return { ok: false, message: GONE };
  }

  if (account.deletedAt) {
    return {
      ok: false,
      message: "This account is already scheduled for deletion.",
    };
  }

  if (account.disabledAt) {
    return { ok: true };
  }

  const updated = await setAccountDisabled({
    userId,
    disabledAt: new Date(),
  });

  if (!updated) {
    return { ok: false, message: GONE };
  }

  await notify(() => sendAccountDisabledEmail(updated.email));

  return { ok: true };
}

export async function reactivateAccount(
  userId: string,
): Promise<AccountActionResult> {
  const account = await findAccountForUser(userId);

  if (!account) {
    return { ok: false, message: GONE };
  }

  if (account.deletedAt) {
    return {
      ok: false,
      message:
        "This account is scheduled for deletion. Restore it from the deletion page instead.",
    };
  }

  if (!account.disabledAt) {
    return { ok: true };
  }

  const updated = await setAccountDisabled({ userId, disabledAt: null });

  if (!updated) {
    return { ok: false, message: GONE };
  }

  await notify(() => sendAccountReactivatedEmail(updated.email));

  return { ok: true };
}

export async function requestAccountDeletion(
  userId: string,
): Promise<AccountActionResult> {
  const account = await findAccountForUser(userId);

  if (!account) {
    return { ok: false, message: GONE };
  }

  if (account.deletedAt) {
    return { ok: true };
  }

  const requestedAt = new Date();
  const updated = await setAccountDeletion({
    userId,
    deletedAt: requestedAt,
    purgeAfter: purgeDateFrom(requestedAt),
  });

  if (!updated?.purgeAfter) {
    return { ok: false, message: GONE };
  }

  await notify(() =>
    sendDeletionRequestedEmail({
      to: updated.email,
      purgeAfter: updated.purgeAfter as Date,
    }),
  );

  return { ok: true };
}

export async function restoreAccount(
  userId: string,
): Promise<AccountActionResult> {
  const account = await findAccountForUser(userId);

  if (!account) {
    return { ok: false, message: GONE };
  }

  if (!account.deletedAt) {
    return { ok: true };
  }

  const updated = await setAccountDeletion({
    userId,
    deletedAt: null,
    purgeAfter: null,
  });

  if (!updated) {
    return { ok: false, message: GONE };
  }

  await notify(() => sendDeletionRestoredEmail(updated.email));

  return { ok: true };
}

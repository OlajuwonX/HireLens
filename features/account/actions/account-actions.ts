"use server";

import {
  requireDatabaseUser,
  requireSessionUserId,
} from "@/features/auth/server/require-database-user";
import {
  disableAccount,
  reactivateAccount,
  requestAccountDeletion,
  restoreAccount,
} from "@/features/account/server/account.service";
import {
  DELETE_CONFIRM_PHRASE,
  DISABLE_CONFIRM_PHRASE,
} from "@/features/account/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AccountFormState } from "./account-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function disableAccountAction(
  _state: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await requireDatabaseUser();

  if (getString(formData, "confirm").toUpperCase() !== DISABLE_CONFIRM_PHRASE) {
    return {
      status: "error",
      message: `Type ${DISABLE_CONFIRM_PHRASE} to confirm.`,
    };
  }

  const result = await disableAccount(user.id);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/", "layout");
  redirect("/account/paused");
}

export async function reactivateAccountAction(
  _state: AccountFormState,
  _formData: FormData,
): Promise<AccountFormState> {
  const userId = await requireSessionUserId();
  const result = await reactivateAccount(userId);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function requestAccountDeletionAction(
  _state: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const user = await requireDatabaseUser();

  if (getString(formData, "confirm").toUpperCase() !== DELETE_CONFIRM_PHRASE) {
    return {
      status: "error",
      message: `Type ${DELETE_CONFIRM_PHRASE} to confirm.`,
    };
  }

  const result = await requestAccountDeletion(user.id);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/", "layout");
  redirect("/account/scheduled");
}

export async function restoreAccountAction(
  _state: AccountFormState,
  _formData: FormData,
): Promise<AccountFormState> {
  const userId = await requireSessionUserId();
  const result = await restoreAccount(userId);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

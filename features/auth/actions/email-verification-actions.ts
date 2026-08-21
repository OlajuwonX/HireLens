"use server";

import {
  completeEmailVerification,
  requestEmailVerification,
} from "@/features/auth/server/email-verification.service";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import type { PasswordFormState } from "./password-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function requestEmailVerificationAction(
  _state: PasswordFormState,
): Promise<PasswordFormState> {
  const user = await requireDatabaseUser();

  try {
    const result = await requestEmailVerification(user.email);

    if (!result.ok) {
      return { status: "error", message: result.message };
    }
  } catch (error) {
    Sentry.captureException(error);

    return {
      status: "error",
      message: "We could not send that email just now. Try again shortly.",
    };
  }

  return {
    status: "saved",
    message:
      "Confirmation link sent. It can take a minute to arrive — check your spam folder if it is not in your inbox.",
  };
}

export async function confirmEmailAction(
  _state: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const result = await completeEmailVerification(getString(formData, "token"));

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  revalidatePath("/settings/account");

  return {
    status: "saved",
    message: "Your email address is confirmed.",
  };
}

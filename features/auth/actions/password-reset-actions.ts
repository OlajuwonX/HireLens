"use server";

import { passwordSchema } from "@/features/auth/schemas/credentials.schema";
import { passwordProblemMessage } from "@/features/auth/schemas/password-rules";
import {
  completePasswordReset,
  requestPasswordReset,
} from "@/features/auth/server/password-reset.service";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import type { PasswordFormState } from "./password-form-state";

const RESET_REQUEST_ACKNOWLEDGEMENT =
  "If an account exists for this email, we've sent a reset link. It can take a minute to arrive, check your spam folder if it is not in your inbox.";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function requestPasswordResetAction(
  _state: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const parsed = z.email().safeParse(getString(formData, "email").trim());

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  try {
    await requestPasswordReset(parsed.data);
  } catch (error) {
    Sentry.captureException(error);
  }

  return { status: "saved", message: RESET_REQUEST_ACKNOWLEDGEMENT };
}

export async function resetPasswordAction(
  _state: PasswordFormState,
  formData: FormData,
): Promise<PasswordFormState> {
  const token = getString(formData, "token");
  const password = getString(formData, "password");

  if (!token) {
    return {
      status: "error",
      message: "That reset link is not valid. Request a new one.",
    };
  }

  if (!passwordSchema.safeParse(password).success) {
    return {
      status: "error",
      message:
        passwordProblemMessage(password) ?? "Choose a stronger password.",
    };
  }

  const result = await completePasswordReset({ token, password });

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  return {
    status: "saved",
    message: "Your password has been updated. You can sign in with it now.",
  };
}

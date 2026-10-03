"use server";

import { signIn, signOut } from "@/auth";
import {
  isRateLimitedSignIn,
  RATE_LIMITED_MESSAGE,
} from "@/features/auth/rate-limited-sign-in";
import {
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas/credentials.schema";
import { passwordProblemMessage } from "@/features/auth/schemas/password-rules";
import { registerCredentialsUser } from "@/features/auth/server/user.service";
import { firstIssueMessage } from "@/lib/forms/zod-error";
import { isRateLimited } from "@/lib/rate-limit";
import { clientIp } from "@/lib/rate-limit/client-ip";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { AuthFormState } from "./auth-form-state";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}

export async function signOutUser() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithCredentials(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = signInSchema.safeParse({
    email: getString(formData, "email"),
    password: getString(formData, "password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: firstIssueMessage(
        parsed.error,
        "Check your details and try again.",
      ),
    };
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (isRateLimitedSignIn(error)) {
      return { status: "error", message: RATE_LIMITED_MESSAGE };
    }

    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "That email and password combination is not correct.",
      };
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function signUpWithCredentials(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (await isRateLimited("signUpIp", clientIp(await headers()))) {
    return { status: "error", message: RATE_LIMITED_MESSAGE };
  }

  const password = getString(formData, "password");
  const parsed = signUpSchema.safeParse({
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    password,
  });

  if (!parsed.success) {
    const passwordProblem =
      parsed.error.issues[0]?.path[0] === "password"
        ? passwordProblemMessage(password)
        : null;

    return {
      status: "error",
      message:
        passwordProblem ??
        firstIssueMessage(parsed.error, "Check your details and try again."),
    };
  }

  const result = await registerCredentialsUser(parsed.data);

  if (!result.ok) {
    return { status: "error", message: result.message };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (isRateLimitedSignIn(error) || error instanceof AuthError) {
      return {
        status: "error",
        message: "Account created, but sign-in failed. Try signing in.",
      };
    }

    throw error;
  }

  redirect("/dashboard");
}

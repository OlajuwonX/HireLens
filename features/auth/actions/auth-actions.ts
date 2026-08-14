"use server";

import { firstIssueMessage } from "@/lib/forms/zod-error";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import {
  signInSchema,
  signUpSchema,
} from "@/features/auth/schemas/credentials.schema";
import { registerCredentialsUser } from "@/features/auth/server/user.service";
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
  const parsed = signUpSchema.safeParse({
    name: getString(formData, "name"),
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
    if (error instanceof AuthError) {
      return {
        status: "error",
        message: "Account created, but sign-in failed. Try signing in.",
      };
    }

    throw error;
  }

  redirect("/dashboard");
}

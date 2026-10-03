import { CredentialsSignin } from "next-auth";

export const RATE_LIMITED_CODE = "rate_limited";

export const RATE_LIMITED_MESSAGE =
  "Too many attempts. Wait a few minutes and try again.";

export class RateLimitedSignIn extends CredentialsSignin {
  code = RATE_LIMITED_CODE;
}

export function isRateLimitedSignIn(error: unknown) {
  return error instanceof CredentialsSignin && error.code === RATE_LIMITED_CODE;
}

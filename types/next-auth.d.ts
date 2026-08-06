import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"];
    account: {
      lastLoginAt: string | null;
      onboardingCompleted: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    lastLoginAt?: string | null;
    onboardingCompleted?: boolean;
  }
}

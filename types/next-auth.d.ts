import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"];
    dbUserId: string | null;
    account: {
      lastLoginAt: string | null;
      onboardingCompleted: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    dbUserId?: string;
    lastLoginAt?: string | null;
    onboardingCompleted?: boolean;
  }
}

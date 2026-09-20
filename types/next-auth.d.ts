import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"];
    dbUserId: string | null;
    account: {
      lastLoginAt: string | null;
      onboardingCompleted: boolean;
    };
    impersonation: {
      actingAdminId: string;
      targetUserId: string;
      expiresAt: string;
    } | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    dbUserId?: string;
    lastLoginAt?: string | null;
    onboardingCompleted?: boolean;
    impersonatedUserId?: string;
    actingAdminId?: string;
    impersonationExpiresAt?: string;
  }
}

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"];
    dbUserId: string | null;
    authTime: number | null;
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
    authTime?: number;
    lastLoginAt?: string | null;
    onboardingCompleted?: boolean;
    impersonatedUserId?: string;
    actingAdminId?: string;
    impersonationExpiresAt?: string;
  }
}

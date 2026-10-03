import { signInSchema } from "@/features/auth/schemas/credentials.schema";
import { isClaimExpired } from "@/features/auth/impersonation-token";
import { RateLimitedSignIn } from "@/features/auth/rate-limited-sign-in";
import { SESSION_MAX_AGE_SECONDS } from "@/features/auth/session-revocation";
import {
  recordSignIn,
  verifyCredentials,
} from "@/features/auth/server/user.service";
import { resolveImpersonationClaimForUpdate } from "@/features/admin/server/impersonation.service";
import { isRateLimited } from "@/lib/rate-limit";
import { clientIp } from "@/lib/rate-limit/client-ip";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

function readImpersonationUpdateSessionId(session: unknown) {
  if (!session || typeof session !== "object" || !("impersonation" in session)) {
    return undefined;
  }

  const value = (session as { impersonation: unknown }).impersonation;

  if (value === null) {
    return null;
  }

  if (value && typeof value === "object" && "sessionPublicId" in value) {
    const raw = (value as { sessionPublicId: unknown }).sessionPublicId;
    return typeof raw === "string" ? raw : undefined;
  }

  return undefined;
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw, request) {
        const parsed = signInSchema.safeParse(raw);

        if (!parsed.success) {
          return null;
        }

        const [ipLimited, emailLimited] = await Promise.all([
          isRateLimited("signInIp", clientIp(request.headers)),
          isRateLimited("signInEmail", parsed.data.email),
        ]);

        if (ipLimited || emailLimited) {
          throw new RateLimitedSignIn();
        }

        const user = await verifyCredentials(parsed.data);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE_SECONDS },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, account, profile, user, trigger, session }) {
      const currentImpersonationExpiresAt =
        typeof token.impersonationExpiresAt === "string"
          ? token.impersonationExpiresAt
          : undefined;

      if (isClaimExpired(currentImpersonationExpiresAt, new Date())) {
        delete token.impersonatedUserId;
        delete token.actingAdminId;
        delete token.impersonationExpiresAt;
      }

      if (trigger === "update") {
        const sessionId = readImpersonationUpdateSessionId(session);

        if (sessionId === null) {
          delete token.impersonatedUserId;
          delete token.actingAdminId;
          delete token.impersonationExpiresAt;
        } else if (
          typeof sessionId === "string" &&
          typeof token.dbUserId === "string"
        ) {
          const claim = await resolveImpersonationClaimForUpdate({
            sessionPublicId: sessionId,
            callerRealUserId: token.dbUserId,
          });

          if (claim) {
            token.impersonatedUserId = claim.targetUserId;
            token.actingAdminId = claim.actingAdminId;
            token.impersonationExpiresAt = claim.expiresAt;
          }
        }
      }

      if (account?.provider === "google" && profile?.email) {
        const record = await recordSignIn({
          profile: {
            name: typeof profile.name === "string" ? profile.name : null,
            email: profile.email,
            image: typeof profile.picture === "string" ? profile.picture : null,
          },
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          emailVerified: profile.email_verified === true,
        });

        token.dbUserId = record.id;
        token.lastLoginAt = record.lastLoginAt?.toISOString() ?? null;
        token.onboardingCompleted = record.onboardingCompleted;
        token.authTime = Date.now();
      }

      if (account?.provider === "credentials" && user) {
        token.dbUserId = typeof user.id === "string" ? user.id : token.dbUserId;
        token.lastLoginAt = new Date().toISOString();
        token.onboardingCompleted = Boolean(token.onboardingCompleted);
        token.authTime = Date.now();
      }

      return token;
    },
    session({ session, token }) {
      session.dbUserId =
        typeof token.dbUserId === "string" ? token.dbUserId : null;
      session.authTime =
        typeof token.authTime === "number" ? token.authTime : null;
      session.account = {
        lastLoginAt:
          typeof token.lastLoginAt === "string" ? token.lastLoginAt : null,
        onboardingCompleted: Boolean(token.onboardingCompleted),
      };
      const impersonatedUserId =
        typeof token.impersonatedUserId === "string"
          ? token.impersonatedUserId
          : undefined;
      const actingAdminId =
        typeof token.actingAdminId === "string"
          ? token.actingAdminId
          : undefined;
      const impersonationExpiresAt =
        typeof token.impersonationExpiresAt === "string"
          ? token.impersonationExpiresAt
          : undefined;

      session.impersonation =
        impersonatedUserId &&
        actingAdminId &&
        !isClaimExpired(impersonationExpiresAt, new Date())
          ? {
              actingAdminId,
              targetUserId: impersonatedUserId,
              expiresAt: impersonationExpiresAt!,
            }
          : null;
      return session;
    },
  },
});

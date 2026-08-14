import { signInSchema } from "@/features/auth/schemas/credentials.schema";
import {
  recordSignIn,
  verifyCredentials,
} from "@/features/auth/server/user.service";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      async authorize(raw) {
        const parsed = signInSchema.safeParse(raw);

        if (!parsed.success) {
          return null;
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
  session: { strategy: "jwt" },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, account, profile, user }) {
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
      }

      if (account?.provider === "credentials" && user) {
        token.dbUserId =
          typeof user.id === "string" ? user.id : token.dbUserId;
        token.lastLoginAt = new Date().toISOString();
        token.onboardingCompleted = Boolean(token.onboardingCompleted);
      }

      return token;
    },
    session({ session, token }) {
      session.dbUserId =
        typeof token.dbUserId === "string" ? token.dbUserId : null;
      session.account = {
        lastLoginAt:
          typeof token.lastLoginAt === "string" ? token.lastLoginAt : null,
        onboardingCompleted: Boolean(token.onboardingCompleted),
      };
      return session;
    },
  },
});

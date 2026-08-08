import { recordSignIn } from "@/features/auth/server/user.service";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        const user = await recordSignIn({
          profile: {
            name: typeof profile.name === "string" ? profile.name : null,
            email: profile.email,
            image: typeof profile.picture === "string" ? profile.picture : null,
          },
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });

        token.lastLoginAt = user.lastLoginAt?.toISOString() ?? null;
        token.onboardingCompleted = user.onboardingCompleted;
      }

      return token;
    },
    session({ session, token }) {
      session.account = {
        lastLoginAt:
          typeof token.lastLoginAt === "string" ? token.lastLoginAt : null,
        onboardingCompleted: Boolean(token.onboardingCompleted),
      };
      return session;
    },
  },
});

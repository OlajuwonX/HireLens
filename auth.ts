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
    jwt({ token }) {
      token.lastLoginAt = new Date().toISOString();
      token.onboardingCompleted = Boolean(token.onboardingCompleted);
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

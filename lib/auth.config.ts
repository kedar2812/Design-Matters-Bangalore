import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config — no Prisma/bcrypt imports here.
 * Used by middleware.ts to verify the session JWT without touching the DB.
 * The Credentials provider lives in lib/auth.ts (server-only).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isStudio = request.nextUrl.pathname.startsWith("/studio");
      if (isStudio) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id;
      if (token.role) session.user.role = token.role;
      return session;
    },
  },
} satisfies NextAuthConfig;

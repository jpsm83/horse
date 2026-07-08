/**
 * NextAuth configuration — OAuth transport for Google sign-in only.
 *
 * Web session truth lives in REST httpOnly cookies (`access_token` / `refresh_token`).
 * After Google OAuth, the client bridges via `POST /api/v1/auth/session`.
 * Email/password sign-in uses `POST /api/v1/auth/login` directly (no NextAuth).
 */

import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { AUTH_CONFIG } from "./config.ts";
import connectDb from "../db.ts";
import * as authService from "../services/authService.ts";
import * as userService from "../services/userService.ts";

export const authOptions: NextAuthOptions = {
  secret: AUTH_CONFIG.SECRET,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: AUTH_CONFIG.GOOGLE_CLIENT_ID,
      clientSecret: AUTH_CONFIG.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider !== "google") {
        return true;
      }

      await connectDb();

      const email = user.email ?? profile?.email;
      if (!email || !account.providerAccountId) {
        return false;
      }

      const emailVerified =
        (profile as { email_verified?: boolean } | undefined)?.email_verified ?? true;

      const { user: dbUser } = await userService.findOrCreateFromGoogle({
        sub: account.providerAccountId,
        email,
        emailVerified,
        name: user.name,
        image: user.image,
      });

      if (dbUser.isActive === false) {
        return false;
      }

      user.id = String(dbUser._id);
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.id) {
        token.userId = user.id;
      }

      if (account?.provider === "google" && user?.email && !token.userId) {
        await connectDb();
        const dbUser = await userService.findByEmail(user.email);
        if (dbUser) {
          token.userId = String(dbUser._id);
        }
      }

      if (token.userId) {
        await connectDb();
        const session = await authService.buildSessionForUserId(String(token.userId));
        token.email = session.email;
        token.emailVerified = session.emailVerified;
        token.authProvider = session.authProvider;
        token.profileComplete = session.profileComplete;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.userId ?? "");
        session.user.email = String(token.email ?? session.user.email ?? "");
        (session.user as { emailVerified?: boolean }).emailVerified = Boolean(token.emailVerified);
        (session.user as { authProvider?: string }).authProvider = token.authProvider as string | undefined;
        (session.user as { profileComplete?: boolean }).profileComplete = Boolean(token.profileComplete);
      }
      return session;
    },
  },
  pages: {},
};

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      emailVerified?: boolean;
      authProvider?: string;
      profileComplete?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    emailVerified?: boolean;
    authProvider?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    emailVerified?: boolean;
    authProvider?: string;
    profileComplete?: boolean;
  }
}

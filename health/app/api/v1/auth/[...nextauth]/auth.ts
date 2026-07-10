import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import connectDb from "@/app/api/db/connectDb";
import User from "@/app/api/models/user";
import Subscriber from "@/app/api/models/subscriber";
import requestEmailConfirmation from "@/app/actions/auth/requestEmailConfirmation";
import { mainCategories } from "@/lib/constants";

import { IUser } from "@/types/user";

// Helper function to generate verification token
function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

// Extend types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      imageUrl?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    imageUrl?: string;
  }

  interface JWT {
    id: string;
    email?: string;
    name?: string;
    role: string;
    imageUrl?: string;
  }
}

// NextAuth configuration
const authOptions: NextAuthConfig = {
  providers: [
    // Google OAuth (sign in + signup if not exists)
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // Credentials login only (no signup here)
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDb();

          const user = (await User.findOne({ email: credentials.email })
            .select("_id email password username role imageUrl")
            .lean()) as Partial<IUser> | null;

          if (!user) {
            return null;
          }

          if (!user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password as string,
            user.password as string
          );

          if (!isValid) {
            return null;
          }

          return {
            id: user._id?.toString() || "",
            email: user.email!,
            name: user.username!,
            role: user.role || "user",
            imageUrl: user.imageUrl,
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },
  // secret: process.env.NEXTAUTH_SECRET!,
  basePath: "/api/v1/auth",
  // Only enable debug mode when explicitly set via AUTH_DEBUG environment variable
  // This prevents the warning message in development
  debug: process.env.AUTH_DEBUG === "true",
  // Enable CSRF protection in production
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true, // Required for CSRF protection in development

  // Callbacks
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          await connectDb();
          const existingUser = await User.findOne({ email: profile.email });

          // Try to get browser info from the state parameter
          let browserLanguage = "en"; // Default fallback
          let browserRegion = "US"; // Default fallback

          // The state parameter contains browser info passed from the frontend
          // This will be available in the account object
          if (account.state && typeof account.state === "string") {
            try {
              const stateData = JSON.parse(account.state);
              browserLanguage = stateData.browserLanguage || "en";
              browserRegion = stateData.browserRegion || "US";
            } catch {
              throw new Error("Could not parse state data, using defaults");
            }
          }

          if (!existingUser) {
            // Generate verification token for email confirmation
            const verificationToken = crypto.randomBytes(32).toString("hex");
            const userId = new mongoose.Types.ObjectId();

            const newUser = new User({
              _id: userId,
              email: profile.email,
              username: (
                profile.name ||
                profile.email?.split("@")[0] ||
                "user_" + Math.random().toString(36).slice(-6)
              )
                .trim() // Trim whitespace from ends
                .replace(/[^a-zA-Z0-9_\-\s]/g, "") // Remove special characters, keep only letters, numbers, underscores, dashes, and spaces
                .replace(/\s+/g, " "), // Replace multiple spaces with single space
              role: "user",
              birthDate: new Date("2000-02-29"),
              lastLogin: new Date(),
              imageUrl: profile.picture,
              preferences: {
                language: browserLanguage, // From browser
                region: browserRegion, // From browser
              },
              password: crypto.randomUUID(), // Google users don't need passwords
              verificationToken,
              emailVerified: false,
            });

            // Start database transaction for subscription handling
            const session = await mongoose.startSession();
            session.startTransaction();

            try {
              // Check if user was previously a newsletter subscriber
              const existingSubscriber = await Subscriber.findOne({
                email: profile.email!.toLowerCase(),
              }).session(session);

              if (existingSubscriber) {
                // Link existing subscription to new user
                await Subscriber.findOneAndUpdate(
                  { email: profile.email!.toLowerCase() },
                  {
                    $set: {
                      userId: userId,
                    },
                  },
                  {
                    new: true,
                    session: session,
                  }
                );
                // Use existing subscriber's ID
                newUser.subscriptionId = existingSubscriber._id;
              } else {
                // Create new subscription for user
                const subscriptionId = new mongoose.Types.ObjectId();

                await Subscriber.create(
                  [
                    {
                      _id: subscriptionId,
                      email: profile.email!.toLowerCase(),
                      userId: userId,
                      emailVerified: false,
                      verificationToken: generateToken(),
                      unsubscribeToken: generateToken(),
                      subscriptionPreferences: {
                        categories: mainCategories,
                        subscriptionFrequencies: "weekly",
                      },
                    },
                  ],
                  { session }
                );
                // Use new subscription's ID
                newUser.subscriptionId = subscriptionId;
              }

              // Save user
              await newUser.save({ session });

              // Commit the transaction
              await session.commitTransaction();
            } catch (error) {
              await session.abortTransaction();
              console.error("Google signup - Transaction failed:", error);
              throw error;
            } finally {
              await session.endSession();
            }

            // Send email confirmation
            try {
              await requestEmailConfirmation(profile.email!);
            } catch (emailError) {
              console.error(
                "Failed to send confirmation email for Google user:",
                emailError
              );
              // Don't fail sign-in if email fails, just log the error
            }
          }
        } catch (error) {
          console.error("Error in Google sign-in callback:", error);
          // Don't throw error here, let the user sign in
        }
        return true;
      }
      return true; // Allow all other sign-in methods
    },

    async jwt({ token, user }) {
      // Initial sign-in: persist user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.imageUrl = user.imageUrl;
        return token;
      }

      // Subsequent requests: sync with DB for Google OAuth users
      if (token.email) {
        await connectDb();
        const dbUser = (await User.findOne({ email: token.email })
          .select("_id role imageUrl username")
          .lean()) as IUser | null;

        if (dbUser) {
          token.id = dbUser._id?.toString();
          token.role = dbUser.role;
          token.imageUrl = dbUser.imageUrl;
          token.name = dbUser.username;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.imageUrl = token.imageUrl as string | undefined;
      }
      return session;
    },
  },

  // Disable NextAuth's default redirect behavior - let frontend handle all navigation
  pages: {
    signIn: "/signin",
  },
};

// This gives you handlers + helpers automatically
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

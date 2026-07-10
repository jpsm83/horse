import connectDb from "@/app/api/db/connectDb";
import Subscriber from "@/app/api/models/subscriber";
import User from "@/app/api/models/user";
import { ISerializedSubscriber, ISubscriptionPreferences } from "@/types/subscriber";
import { mainCategories } from "@/lib/constants";
import mongoose from "mongoose";

// Helper function to serialize MongoDB subscriber object
function serializeSubscriber(subscriber: unknown): ISerializedSubscriber {
  const s = subscriber as {
    _id?: { toString: () => string };
    email: string;
    emailVerified: boolean;
    unsubscribeToken: string;
    userId?: { toString: () => string };
    subscriptionPreferences?: {
      categories?: unknown[];
      subscriptionFrequencies?: string;
    };
    createdAt?: Date;
    updatedAt?: Date;
  };

  return {
    _id: s._id?.toString() || "",
    email: s.email,
    emailVerified: s.emailVerified,
    unsubscribeToken: s.unsubscribeToken,
    userId: s.userId?.toString() || null,
    subscriptionPreferences: {
      categories: (s.subscriptionPreferences?.categories as string[]) || [],
      subscriptionFrequencies:
        s.subscriptionPreferences?.subscriptionFrequencies || "weekly",
    },
    createdAt: s.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: s.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

// Helper function to generate verification token
function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Helper function to generate unsubscribe token
function generateUnsubscribeToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function getSubscribersService(): Promise<ISerializedSubscriber[]> {
  await connectDb();

  const subscribers = await Subscriber.find()
    .select("-verificationToken")
    .sort({ createdAt: -1 })
    .lean();

  return subscribers.map(serializeSubscriber);
}

export async function getSubscriberByIdService(
  subscriberId: string
): Promise<ISerializedSubscriber | null> {
  if (!subscriberId) {
    throw new Error("Subscriber ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new Error("Invalid subscriber ID format");
  }

  await connectDb();

  const subscriber = await Subscriber.findById(subscriberId).lean();

  if (!subscriber) {
    return null;
  }

  return serializeSubscriber(subscriber);
}

export interface SubscribeToNewsletterParams {
  email: string;
  preferences?: {
    categories?: string[];
    subscriptionFrequencies?: string;
  };
}

export interface SubscribeToNewsletterResult {
  subscriber: ISerializedSubscriber;
  isNew: boolean;
}

export async function subscribeToNewsletterService(
  params: SubscribeToNewsletterParams
): Promise<SubscribeToNewsletterResult> {
  const { email, preferences } = params;

  if (!email) {
    throw new Error("Email is required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Please enter a valid email address!");
  }

  await connectDb();

  // Check if user already has an account (to prevent duplicate subscriptions)
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error("This email is already registered. Please manage your newsletter preferences in your profile.");
  }

  // Check if subscriber already exists
  let subscriber = await Subscriber.findOne({ email: email.toLowerCase() });
  let isNew = false;

  if (subscriber) {
    // Update existing subscriber preferences and resend confirmation
    subscriber.emailVerified = false;
    subscriber.verificationToken = generateVerificationToken();
    subscriber.unsubscribeToken = generateUnsubscribeToken();
    subscriber.subscriptionPreferences = {
      categories: preferences?.categories || mainCategories,
      subscriptionFrequencies: preferences?.subscriptionFrequencies || "weekly",
    };
    await subscriber.save();
  } else {
    // Create new subscriber
    const subscriberData = {
      email: email.toLowerCase(),
      userId: null, // No user account yet
      subscriptionPreferences: {
        categories: preferences?.categories || mainCategories,
        subscriptionFrequencies: preferences?.subscriptionFrequencies || "weekly",
      },
      verificationToken: generateVerificationToken(),
      unsubscribeToken: generateUnsubscribeToken(),
    };

    subscriber = await Subscriber.create(subscriberData);
    isNew = true;
  }

  return {
    subscriber: serializeSubscriber(subscriber),
    isNew,
  };
}

export interface UnsubscribeFromNewsletterParams {
  email: string;
  token?: string;
}

export interface UnsubscribeFromNewsletterResult {
  hasUserAccount: boolean;
  deleted: boolean;
}

export async function unsubscribeFromNewsletterService(
  params: UnsubscribeFromNewsletterParams
): Promise<UnsubscribeFromNewsletterResult> {
  const { email, token } = params;

  if (!email) {
    throw new Error("Email is required!");
  }

  await connectDb();
  
  // Try to find subscriber with different email formats
  let subscriber = await Subscriber.findOne({ 
    email: email.toLowerCase()
  });
  
  if (!subscriber) {
    // Try to find with original email case
    subscriber = await Subscriber.findOne({ 
      email: email
    });
    
    if (!subscriber) {
      throw new Error("Subscriber not found!");
    }
  }

  // If token is provided, validate it
  if (token && subscriber.unsubscribeToken !== token) {
    throw new Error("Invalid unsubscribe link!");
  }

  // Check if subscriber has a linked user account by email
  const actualUser = await User.findOne({ email: email.toLowerCase() });
  const hasUserAccount = !!actualUser;
  
  if (hasUserAccount) {
    // User has account - only deactivate subscription (don't delete data)
    subscriber.emailVerified = false;
    await subscriber.save();
    
    return {
      hasUserAccount: true,
      deleted: false,
    };
  } else {
    // No user account - delete all subscriber data
    await Subscriber.findByIdAndDelete(subscriber._id);
    
    return {
      hasUserAccount: false,
      deleted: true,
    };
  }
}

export interface ConfirmNewsletterSubscriptionParams {
  token: string;
  email: string;
}

export async function confirmNewsletterSubscriptionService(
  params: ConfirmNewsletterSubscriptionParams
): Promise<void> {
  const { token, email } = params;

  if (!token || !email) {
    throw new Error("Token and email are required!");
  }

  await connectDb();

  const subscriber = await Subscriber.findOne({
    email: email.toLowerCase(),
    verificationToken: token,
  });

  if (!subscriber) {
    throw new Error("Invalid or expired confirmation link!");
  }

  // Mark email as verified and clear verification token
  subscriber.emailVerified = true;
  subscriber.verificationToken = undefined;
  subscriber.unsubscribeToken = generateUnsubscribeToken();
  await subscriber.save();
}

export interface UpdateSubscriberPreferencesParams {
  subscriberId: string;
  subscriptionPreferences: ISubscriptionPreferences;
}

export async function updateSubscriberPreferencesService(
  params: UpdateSubscriberPreferencesParams
): Promise<ISerializedSubscriber> {
  const { subscriberId, subscriptionPreferences } = params;

  if (!subscriberId) {
    throw new Error("Subscriber ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new Error("Invalid subscriber ID format");
  }

  await connectDb();

  const subscriber = await Subscriber.findById(subscriberId);

  if (!subscriber) {
    throw new Error("Subscriber not found");
  }

  // Update subscriber preferences
  const updatedSubscriber = await Subscriber.findByIdAndUpdate(
    subscriberId,
    { $set: { subscriptionPreferences } },
    {
      new: true,
      lean: true,
    }
  );

  if (!updatedSubscriber) {
    throw new Error("Subscriber not found");
  }

  return serializeSubscriber(updatedSubscriber);
}


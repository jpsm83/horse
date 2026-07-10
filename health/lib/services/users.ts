import connectDb from "@/app/api/db/connectDb";
import User from "@/app/api/models/user";
import Subscriber from "@/app/api/models/subscriber";
import Article from "@/app/api/models/article";
import { ISerializedUser, IUserPreferences, IUser } from "@/types/user";
import { IArticleLean, ISerializedArticle, serializeMongoObject } from "@/types/article";
import { mainCategories } from "@/lib/constants";
import { hash } from "bcrypt";
import crypto from "crypto";
import mongoose from "mongoose";
import { applyLocaleFilter } from "./articles";

// Helper function to serialize MongoDB user object
function serializeUser(user: unknown, subscriptionPreferences?: unknown): ISerializedUser {
  const toPlainObject = (obj: unknown): unknown => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== "object") return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(toPlainObject);
    return JSON.parse(JSON.stringify(obj));
  };

  const u = user as {
    _id?: { toString: () => string };
    username: string;
    email: string;
    role: string;
    birthDate?: Date;
    imageFile?: string;
    imageUrl?: string;
    preferences?: unknown;
    subscriptionId?: { toString: () => string };
    likedArticles?: unknown[];
    commentedArticles?: unknown[];
    lastLogin?: Date;
    isActive?: boolean;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  };

  const subPrefs = subscriptionPreferences as {
    categories?: unknown[];
    subscriptionFrequencies?: string;
  } | null;

  return {
    _id: u._id?.toString() || "",
    username: u.username,
    email: u.email,
    role: u.role,
    birthDate: u.birthDate?.toISOString() || new Date().toISOString(),
    imageFile: u.imageFile,
    imageUrl: u.imageUrl,
    preferences: (toPlainObject(u.preferences) as ISerializedUser["preferences"]) || {
      language: "en",
      region: "US",
    },
    subscriptionId: u.subscriptionId?.toString() || null,
    subscriptionPreferences: subPrefs
      ? {
          categories: Array.isArray(subPrefs.categories)
            ? subPrefs.categories.map((cat: unknown) => String(cat))
            : [],
          subscriptionFrequencies: String(subPrefs.subscriptionFrequencies || "weekly"),
        }
      : {
          categories: [],
          subscriptionFrequencies: "weekly",
        },
    likedArticles:
      u.likedArticles?.map((id: unknown) => {
        if (id && typeof id === "object" && "toString" in id) {
          return id.toString();
        }
        return String(id);
      }) || [],
    commentedArticles:
      u.commentedArticles?.map((id: unknown) => {
        if (id && typeof id === "object" && "toString" in id) {
          return id.toString();
        }
        return String(id);
      }) || [],
    lastLogin: u.lastLogin?.toISOString(),
    isActive: u.isActive,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt?.toISOString(),
    updatedAt: u.updatedAt?.toISOString(),
  };
}

export async function getUsersService(): Promise<ISerializedUser[]> {
  await connectDb();

  const users = await User.find().select("-password").lean();

  if (!users || users.length === 0) {
    return [];
  }

  return users.map((user) => serializeUser(user));
}

export async function getUserByIdService(
  userId: string
): Promise<ISerializedUser | null> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  await connectDb();

  const user = await User.findById(userId).select("-password").lean();

  if (!user) {
    return null;
  }

  // Get subscription preferences if user has a subscription
  let subscriptionPreferences = null;
  const userWithSubscription = user as unknown as { subscriptionId?: unknown };
  if (userWithSubscription.subscriptionId) {
    const subscriber = await Subscriber.findById(
      userWithSubscription.subscriptionId
    )
      .select("subscriptionPreferences")
      .lean();

    if (
      subscriber &&
      !Array.isArray(subscriber) &&
      (subscriber as unknown as { subscriptionPreferences?: unknown }).subscriptionPreferences
    ) {
      const subscriberWithPrefs = subscriber as unknown as { subscriptionPreferences: unknown };
      subscriptionPreferences = JSON.parse(
        JSON.stringify(subscriberWithPrefs.subscriptionPreferences)
      );
    }
  }

  return serializeUser(user, subscriptionPreferences);
}

export interface GetUserLikedArticlesResult {
  articles: ISerializedArticle[];
  totalDocs: number;
  totalPages: number;
  currentPage: number;
}

export async function getUserLikedArticlesService(
  userId: string,
  page: number = 1,
  limit: number = 6,
  locale: string = "en"
): Promise<GetUserLikedArticlesResult> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  await connectDb();

  const user = await User.findById(userId).select("likedArticles");

  if (!user) {
    throw new Error("User not found!");
  }

  if (!user.likedArticles || user.likedArticles.length === 0) {
    return {
      articles: [],
      totalDocs: 0,
      totalPages: 0,
      currentPage: page,
    };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const totalDocs = user.likedArticles.length;
  const totalPages = Math.ceil(totalDocs / limit);

  // Get the paginated liked article IDs
  const paginatedLikedArticleIds = user.likedArticles.slice(skip, skip + limit);

  // Find articles that match the liked article IDs
  const articles = await Article.find({
    _id: { $in: paginatedLikedArticleIds },
    "languages.hreflang": locale,
  })
    .sort({ createdAt: -1 })
    .lean();

  // Apply locale filter to ensure only matching locale content is included
  const filteredArticles = applyLocaleFilter(articles as IArticleLean[], locale);

  // Serialize the articles
  const serializedArticles = filteredArticles.map((article) =>
    serializeMongoObject(article)
  ) as ISerializedArticle[];

  return {
    articles: serializedArticles,
    totalDocs,
    totalPages,
    currentPage: page,
  };
}

export async function deactivateUserService(
  userId: string
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required");
  }

  await connectDb();

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found!");
  }

  await User.findByIdAndUpdate(userId, { $set: { isActive: false } });
}

// Helper function to generate verification token
function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export interface CreateUserServiceParams {
  username: string;
  email: string;
  password: string;
  role: string;
  birthDate: string;
  preferences: IUserPreferences;
  imageUrl?: string;
  imageFile?: string;
}

export interface CreateUserServiceResult {
  userId: string;
  subscriptionId: string | null;
}

export async function createUserService(
  params: CreateUserServiceParams
): Promise<CreateUserServiceResult> {
  const { username, email, password, role, birthDate, preferences, imageUrl, imageFile } = params;

  await connectDb();

  // Check for duplicate email
  const duplicateUser = await User.findOne({ email });
  if (duplicateUser) {
    throw new Error("User with email already exists!");
  }

  // Hash password
  const hashedPassword = await hash(password, 10);

  const userId = new mongoose.Types.ObjectId();
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const newUser: IUser = {
    _id: userId,
    username,
    email,
    password: hashedPassword,
    role,
    birthDate: new Date(birthDate),
    preferences,
    lastLogin: new Date(),
    verificationToken,
    emailVerified: false,
  };

  // Add image if provided (uploaded by route)
  if (imageUrl) {
    newUser.imageUrl = imageUrl;
    newUser.imageFile = imageFile;
  }

  // Start database transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user was previously a newsletter subscriber
    const existingSubscriber = await Subscriber.findOne({
      email: email.toLowerCase(),
    }).session(session);

    if (existingSubscriber) {
      // Link existing subscription to new user
      await Subscriber.findOneAndUpdate(
        { email: email.toLowerCase() },
        { $set: { userId: newUser._id } },
        { new: true, session: session }
      );
      newUser.subscriptionId = existingSubscriber._id;
    } else {
      // Create new subscription for user
      const subscriptionId = new mongoose.Types.ObjectId();
      await Subscriber.create(
        [
          {
            _id: subscriptionId,
            email: email.toLowerCase(),
            userId: newUser._id,
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
      newUser.subscriptionId = subscriptionId;
    }

    // Create user
    await User.create([newUser], { session });

    // Commit the transaction
    await session.commitTransaction();

    return {
      userId: userId.toString(),
      subscriptionId: newUser.subscriptionId?.toString() || null,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

export interface UpdateUserServiceParams {
  userId: string;
  updateData: Partial<IUser>;
}

export async function updateUserService(
  params: UpdateUserServiceParams
): Promise<void> {
  const { userId, updateData } = params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format");
  }

  await connectDb();

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    {
      new: true,
      lean: true,
    }
  );

  if (!updatedUser) {
    throw new Error("User not found");
  }
}


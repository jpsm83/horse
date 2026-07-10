import { Types } from 'mongoose';

export interface IUserPreferences {
  language: string;
  region: string;
}

export interface ISubscriptionPreferences {
  categories: string[];
  subscriptionFrequencies: string;
}

export interface IReadingHistoryItem {
  articlesId: Types.ObjectId;
  readAt?: Date;
}

export interface IUser {
  _id?: Types.ObjectId | string;
  username: string;
  email: string;
  password?: string;
  role: string;
  birthDate: Date;
  imageFile?: string;
  imageUrl?: string;
  preferences: IUserPreferences;
  subscriptionPreferences?: ISubscriptionPreferences;
  likedArticles?: Types.ObjectId[];
  commentedArticles?: Types.ObjectId[];
  subscriptionId?: Types.ObjectId | null;
  readingHistory?: IReadingHistoryItem[];
  lastLogin?: Date;
  isActive?: boolean;
  emailVerified?: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Serialized user interface for client components
export interface ISerializedUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  birthDate: string;
  imageFile?: string;
  imageUrl?: string;
  preferences: IUserPreferences;
  subscriptionPreferences?: ISubscriptionPreferences;
  likedArticles?: string[];
  commentedArticles?: string[];
  subscriptionId?: string | null;
  lastLogin?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// User creation parameters
export interface ICreateUserParams {
  username: string;
  email: string;
  password: string;
  role: string;
  birthDate: string;
  language: string;
  region: string;
  imageFile?: File;
}

// User update parameters (flexible for partial updates)
export interface IUpdateUserParams {
  username?: string;
  email?: string;
  role?: string;
  birthDate?: string;
  language?: string;
  region?: string;
  imageFile?: File;
  currentPassword?: string;
  newPassword?: string;
}

// Legacy interface for backward compatibility (required fields)
export interface IUpdateUserParamsRequired {
  username: string;
  email: string;
  role: string;
  birthDate: string;
  language: string;
  region: string;
  imageFile?: File;
}

// User response types
export interface IUserResponse {
  success: boolean;
  message?: string;
  data?: ISerializedUser | ISerializedUser[];
  error?: string;
}

export interface ICreateUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IUpdateUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IDeleteUserResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IUpdateProfileData {
  username?: string;
  email?: string;
  role?: string;
  birthDate?: string;
  preferences?: {
    language: string;
    region: string;
  };
  subscriptionPreferences?: ISubscriptionPreferences;
  subscriptionId?: string | null;
  imageFile?: File;
  currentPassword?: string;
  newPassword?: string;
}

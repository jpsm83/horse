import { Types, Document } from "mongoose";

export interface ICommentReport {
  userId: Types.ObjectId;
  reason: 'bad_language' | 'racist' | 'spam' | 'harassment' | 'inappropriate_content' | 'false_information' | 'other';
  reportedAt?: Date;
}

export interface IComment {
  _id?: Types.ObjectId;
  articleId: Types.ObjectId;
  userId: Types.ObjectId | { _id: Types.ObjectId; username: string; imageUrl?: string };
  comment: string;
  likes?: Types.ObjectId[];
  reports?: ICommentReport[];
  createdAt?: Date;
  updatedAt?: Date;
}

// MongoDB Document type for Comment
export interface ICommentDocument extends Document {
  _id: Types.ObjectId;
  articleId: Types.ObjectId;
  userId: Types.ObjectId;
  comment: string;
  likes?: Types.ObjectId[];
  reports?: ICommentReport[];
  createdAt: Date;
  updatedAt: Date;
}

// Lean Comment type (for .lean() queries)
export interface ICommentLean {
  _id: Types.ObjectId;
  articleId: Types.ObjectId;
  userId: Types.ObjectId;
  comment: string;
  likes?: Types.ObjectId[];
  reports?: ICommentReport[];
  createdAt: Date;
  updatedAt: Date;
}

// Serialized Comment type (for client components)
export interface ISerializedComment {
  _id: string;
  articleId: string;
  userId: string | { _id: string; username: string; imageUrl?: string };
  comment: string;
  likes?: string[];
  reports?: ISerializedCommentReport[];
  createdAt: string;
  updatedAt: string;
}

// Serialized Comment Report type
export interface ISerializedCommentReport {
  userId: string;
  reason: 'bad_language' | 'racist' | 'spam' | 'harassment' | 'inappropriate_content' | 'false_information' | 'other';
  reportedAt: string;
}

// Parameters for creating a comment
export interface ICreateCommentParams {
  articleId: string;
  userId: string;
  comment: string;
}

// Parameters for updating a comment
export interface IUpdateCommentParams {
  commentId: string;
  userId: string;
  comment: string;
}

// Parameters for deleting a comment
export interface IDeleteCommentParams {
  commentId: string;
  userId: string;
}

// Parameters for liking a comment
export interface IToggleCommentLikeParams {
  commentId: string;
  userId: string;
}

// Parameters for reporting a comment
export interface IReportCommentParams {
  commentId: string;
  userId: string;
  reason: string;
}

// Parameters for getting comments
export interface IGetCommentsParams {
  articleId?: string;
  userId?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

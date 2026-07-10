import connectDb from "@/app/api/db/connectDb";
import Comment from "@/app/api/models/comment";
import Article from "@/app/api/models/article";
import User from "@/app/api/models/user";
import {
  IGetCommentsParams,
  ISerializedComment,
} from "@/types/comment";
import { Types } from "mongoose";

// Helper function to serialize comment
const serializeComment = (
  comment: Record<string, unknown>
): ISerializedComment => {
  let userId: string | { _id: string; username: string; imageUrl?: string };

  if (
    comment.userId &&
    typeof comment.userId === "object" &&
    comment.userId !== null &&
    "username" in comment.userId
  ) {
    const user = comment.userId as {
      _id: { toString: () => string };
      username: string;
      imageUrl?: string;
    };
    userId = {
      _id: user._id.toString(),
      username: user.username,
      imageUrl: user.imageUrl,
    };
  } else {
    userId = (comment.userId as { toString: () => string })?.toString() || "";
  }

  return {
    _id: (comment._id as { toString: () => string }).toString(),
    articleId: (comment.articleId as { toString: () => string }).toString(),
    userId,
    comment: comment.comment as string,
    likes: (comment.likes as unknown[])?.map((like: unknown) =>
      (like as { toString: () => string }).toString()
    ) || [],
    reports: (comment.reports as unknown[])?.map((report: unknown) => {
      const reportObj = report as Record<string, unknown>;
      return {
        userId: (reportObj.userId as { toString: () => string }).toString(),
        reason: reportObj.reason as
          | "bad_language"
          | "racist"
          | "spam"
          | "harassment"
          | "inappropriate_content"
          | "false_information"
          | "other",
        reportedAt:
          (reportObj.reportedAt as Date)?.toISOString() ||
          new Date().toISOString(),
      };
    }) || [],
    createdAt:
      (comment.createdAt as Date)?.toISOString() ||
      new Date().toISOString(),
    updatedAt:
      (comment.updatedAt as Date)?.toISOString() ||
      new Date().toISOString(),
  };
};

export interface GetCommentsResult {
  comments: ISerializedComment[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

export async function getCommentsService(
  params: IGetCommentsParams
): Promise<GetCommentsResult> {
  try {
    const {
      articleId,
      userId,
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
    } = params;

    await connectDb();

    const query: Record<string, unknown> = {};

    if (articleId) {
      query.articleId = new Types.ObjectId(articleId);
    }

    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }

    const sortObj: Record<string, 1 | -1> = {};
    sortObj[sort] = order === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      Comment.find(query)
        .populate({
          path: "userId",
          select: "username imageUrl",
          model: "User",
        })
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments(query),
    ]);

    const serializedComments = comments.map((comment) =>
      serializeComment(comment as Record<string, unknown>)
    );

    const hasMore = skip + limit < totalCount;

    return {
      comments: serializedComments,
      totalCount,
      hasMore,
      page,
      limit,
    };
  } catch (error) {
    // Log the error but return a serializable empty response
    console.error("Error in getCommentsService:", {
      error,
      articleId: params.articleId,
      userId: params.userId,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : typeof error,
    });
    
    // Return empty serializable response instead of throwing
    // This prevents Next.js 15 serialization errors
    return {
      comments: [],
      totalCount: 0,
      hasMore: false,
      page: params.page || 1,
      limit: params.limit || 10,
    };
  }
}

export async function createCommentService(
  articleId: string,
  userId: string,
  commentText: string
): Promise<ISerializedComment> {
  if (!articleId || !commentText) {
    throw new Error("Article ID and comment are required");
  }

  const trimmed = commentText.trim();
  if (!trimmed) {
    throw new Error("Comment cannot be empty");
  }
  if (trimmed.length > 1000) {
    throw new Error("Comment cannot be longer than 1000 characters");
  }
  if (trimmed.includes("http")) {
    throw new Error("Comment cannot contain links");
  }

  await connectDb();

  // Check if article exists
  const article = await Article.findById(articleId);
  if (!article) {
    throw new Error("Article not found");
  }

  // Check if user has already commented on this article
  const existingComment = await Comment.findOne({
    articleId: new Types.ObjectId(articleId),
    userId: new Types.ObjectId(userId),
  });

  if (existingComment) {
    throw new Error("You have already commented on this article");
  }

  // Create new comment
  const newComment = new Comment({
    articleId: new Types.ObjectId(articleId),
    userId: new Types.ObjectId(userId),
    comment: trimmed,
  });

  const savedComment = await newComment.save();

  // Update article's comment count
  await Article.findByIdAndUpdate(articleId, {
    $inc: { commentsCount: 1 },
  });

  // Update user's commentedArticles array
  await User.findByIdAndUpdate(userId, {
    $addToSet: { commentedArticles: articleId },
  });

  // Populate user data for the comment
  const populatedComment = await Comment.findById(savedComment._id)
    .populate({
      path: "userId",
      select: "username imageUrl",
      model: "User",
    })
    .lean();

  if (!populatedComment) {
    throw new Error("Failed to create comment");
  }

  return serializeComment(populatedComment as Record<string, unknown>);
}

export async function deleteCommentService(
  commentId: string,
  userId: string,
  isAdmin: boolean
): Promise<void> {
  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  await connectDb();

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  // Check permissions
  if (!isAdmin && comment.userId.toString() !== userId) {
    throw new Error("You don't have permission to delete this comment");
  }

  // Permanently delete the comment
  const deletedComment = await Comment.findByIdAndDelete(commentId);

  if (!deletedComment) {
    throw new Error("Failed to delete comment");
  }

  // Update article's comment count
  await Article.findByIdAndUpdate(comment.articleId, {
    $inc: { commentsCount: -1 },
  });

  // Check if user has any other comments on this article
  const otherComments = await Comment.findOne({
    articleId: comment.articleId,
    userId: comment.userId,
    _id: { $ne: commentId },
  });

  // If no other comments exist, remove article from user's commentedArticles array
  if (!otherComments) {
    await User.findByIdAndUpdate(comment.userId, {
      $pull: { commentedArticles: comment.articleId },
    });
  }
}

export interface ToggleCommentLikeResult {
  liked: boolean;
  likeCount: number;
}

export async function toggleCommentLikeService(
  commentId: string,
  userId: string
): Promise<ToggleCommentLikeResult> {
  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  await connectDb();

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new Error("Comment not found");
  }

  if (comment.isDeleted) {
    throw new Error("Cannot like a deleted comment");
  }

  const userLiked = comment.likes?.includes(new Types.ObjectId(userId));

  // Toggle like status using atomic operation
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    userLiked
      ? { $pull: { likes: new Types.ObjectId(userId) } }
      : { $addToSet: { likes: new Types.ObjectId(userId) } },
    { new: true }
  );

  if (!updatedComment) {
    throw new Error("Failed to update comment like");
  }

  return {
    liked: !userLiked,
    likeCount: updatedComment.likes?.length || 0,
  };
}

export interface ReportCommentResult {
  comment: {
    comment: string;
    articleTitle: string;
    authorEmail: string;
    authorUsername: string;
    authorLanguage: string;
  };
}

export async function reportCommentService(
  commentId: string,
  userId: string,
  reason: string
): Promise<ReportCommentResult> {
  if (!commentId) {
    throw new Error("Comment ID is required");
  }

  if (!reason) {
    throw new Error("Report reason is required");
  }

  const { commentReportReasons } = await import("@/lib/constants");
  if (!commentReportReasons.includes(reason)) {
    throw new Error("Invalid report reason");
  }

  await connectDb();

  const comment = await Comment.findById(commentId).populate({
    path: "articleId",
    select: "languages.content.mainTitle",
  }).populate({
    path: "userId",
    select: "email username preferences.language",
  });

  if (!comment) {
    throw new Error("Comment not found!");
  }

  if (comment.isDeleted) {
    throw new Error("Cannot report a deleted comment!");
  }

  // Check if user already reported this comment
  const alreadyReported = comment.reports?.some(
    (report: { userId: { toString: () => string } }) =>
      report.userId.toString() === userId
  );

  if (alreadyReported) {
    throw new Error("You have already reported this comment!");
  }

  // Add report to comment
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $push: {
        reports: {
          userId: new Types.ObjectId(userId),
          reason: reason,
          reportedAt: new Date(),
        },
      },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new Error("Failed to report comment!");
  }

  // Extract data needed for email
  const article = comment.articleId as {
    languages?: Array<{ content?: { mainTitle?: string } }>;
  } | null;
  const articleTitle =
    article?.languages?.[0]?.content?.mainTitle || "Unknown Article";

  const commentAuthor = comment.userId as {
    email?: string;
    username?: string;
    preferences?: { language?: string };
  } | null;

  if (!commentAuthor || !commentAuthor.email || !commentAuthor.username) {
    throw new Error("Comment author information not found");
  }

  return {
    comment: {
      comment: comment.comment as string,
      articleTitle,
      authorEmail: commentAuthor.email,
      authorUsername: commentAuthor.username,
      authorLanguage: commentAuthor.preferences?.language || "en",
    },
  };
}


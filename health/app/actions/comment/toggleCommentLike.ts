"use server";

import { IToggleCommentLikeParams } from "@/types/comment";
import { toggleCommentLikeService } from "@/lib/services/comments";

export const toggleCommentLike = async (params: IToggleCommentLikeParams): Promise<{
  success: boolean;
  liked?: boolean;
  likeCount?: number;
  message?: string;
  error?: string;
}> => {
  try {
    const { commentId, userId } = params;

    if (!userId) {
      throw new Error("You must be signed in to like comments");
    }

    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    const { liked, likeCount } = await toggleCommentLikeService(commentId, userId);

    return {
      success: true,
      liked,
      likeCount,
      message: liked ? "Comment liked" : "Comment unliked",
    };
  } catch (error) {
    console.error("Error in toggleCommentLike:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle comment like",
    };
  }
};

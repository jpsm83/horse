"use server";

import { IDeleteCommentParams } from "@/types/comment";
import { deleteCommentService } from "@/lib/services/comments";

export const deleteComment = async (params: IDeleteCommentParams & { isAdmin?: boolean }): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const { commentId, userId, isAdmin = false } = params;

    if (!userId) {
      throw new Error("You must be signed in to delete comments");
    }

    if (!commentId) {
      throw new Error("Comment ID is required");
    }

    await deleteCommentService(commentId, userId, isAdmin);

    return { success: true };
  } catch (error) {
    console.error("Error in deleteComment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete comment",
    };
  }
};

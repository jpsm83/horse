"use server";

import { ICreateCommentParams, ISerializedComment } from "@/types/comment";
import { createCommentService } from "@/lib/services/comments";

export const createComment = async (params: ICreateCommentParams): Promise<{
  success: boolean;
  comment?: ISerializedComment;
  error?: string;
}> => {
  try {
    const { articleId, userId, comment } = params;

    if (!userId) {
      throw new Error("You must be signed in to comment");
    }

    if (!articleId) {
      throw new Error("Article ID is required");
    }

    const commentData = await createCommentService(articleId, userId, comment);

    return {
      success: true,
      comment: commentData,
    };
  } catch (error) {
    console.error("Create comment failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create comment",
    };
  }
};

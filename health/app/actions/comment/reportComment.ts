"use server";

import { IReportCommentParams } from "@/types/comment";
import { reportCommentService } from "@/lib/services/comments";

export const reportComment = async (params: IReportCommentParams): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> => {
  try {
    const { commentId, userId, reason } = params;

    if (!userId || !commentId || !reason) {
      throw new Error("User id, comment id, and reason are required!");
    }

    await reportCommentService(commentId, userId, reason);

    return {
      success: true,
      message: "Comment reported successfully",
    };
  } catch (error) {
    console.error("Error in reportComment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to report comment",
    };
  }
};

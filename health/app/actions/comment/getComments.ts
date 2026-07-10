"use server";

import { IGetCommentsParams, ISerializedComment } from "@/types/comment";
import { getCommentsService } from "@/lib/services/comments";

export const getComments = async (params: IGetCommentsParams): Promise<{
  success: boolean;
  comments?: ISerializedComment[];
  totalCount?: number;
  hasMore?: boolean;
  error?: string;
}> => {
  try {
    const result = await getCommentsService(params);

    return {
      success: true,
      comments: result.comments,
      totalCount: result.totalCount,
      hasMore: result.hasMore,
    };
  } catch (error) {
    console.error("Error in getComments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get comments",
    };
  }
};

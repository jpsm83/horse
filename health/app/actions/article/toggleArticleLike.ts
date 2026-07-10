"use server";

import { toggleArticleLikeService } from "@/lib/services/articles";

export const toggleArticleLike = async (articleId: string, userId: string) => {
  try {
    if (!userId) {
      throw new Error("You must be signed in to like articles");
    }

    const { liked, likeCount } = await toggleArticleLikeService(articleId, userId);

    return {
      success: true,
      liked,
      likeCount,
      message: liked ? "Article liked" : "Article unliked",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle like",
    };
  }
};

"use server";

import { incrementArticleViewsService } from "@/lib/services/articles";

export const incrementArticleViews = async (articleId: string) => {
  try {
    if (!articleId) {
      throw new Error("Article ID is required");
    }

    const views = await incrementArticleViewsService(articleId);

    return {
      success: true,
      views,
      message: "Article views incremented successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to increment views",
    };
  }
};

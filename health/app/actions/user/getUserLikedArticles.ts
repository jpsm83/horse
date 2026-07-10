"use server";

import { ISerializedArticle } from "@/types/article";
import { getUserLikedArticlesService } from "@/lib/services/users";

export interface IGetUserLikedArticlesResponse {
  success: boolean;
  data?: ISerializedArticle[];
  totalDocs?: number;
  totalPages?: number;
  currentPage?: number;
  message?: string;
  error?: string;
}

export async function getUserLikedArticles(
  userId: string,
  page: number = 1,
  limit: number = 6,
  locale: string = "en"
): Promise<IGetUserLikedArticlesResponse> {
  try {
    const result = await getUserLikedArticlesService(userId, page, limit, locale);

    return {
      success: true,
      data: result.articles,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    };
  } catch (error) {
    console.error("Get user liked articles failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Get user liked articles failed!",
    };
  }
}

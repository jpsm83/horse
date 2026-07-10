"use server";

import { getBaseUrl } from "@/lib/utils/getBaseUrl";
import { ISerializedArticle } from "@/types/article";

// Note: This action calls the API route because the route handles
// FormData parsing, file uploads, and validation before calling the service.

interface UpdateArticleParams {
  articleId: string;
  category?: string;
  languages?: unknown;
  imagesContext?: {
    imageOne: string;
    imageTwo: string;
    imageThree: string;
    imageFour: string;
  };
  articleImages?: File[] | string[];
  userId: string;
  isAdmin?: boolean;
}

export interface IUpdateArticleResponse {
  success: boolean;
  message?: string;
  article?: ISerializedArticle;
  error?: string;
}

export async function updateArticle(
  params: UpdateArticleParams
): Promise<IUpdateArticleResponse> {
  try {
    // Note: This action calls the API route because the route handles
    // FormData parsing, file uploads, and validation. For file uploads,
    // call the API route directly with FormData from the frontend.
    
    const formData = new FormData();
    if (params.category) formData.append("category", params.category);
    if (params.languages) formData.append("languages", JSON.stringify(params.languages));
    if (params.imagesContext) formData.append("imagesContext", JSON.stringify(params.imagesContext));
    if (params.articleImages) {
      // Handle both File[] and string[]
      if (Array.isArray(params.articleImages)) {
        params.articleImages.forEach((img) => {
          if (img instanceof File) {
            formData.append("articleImageFiles", img);
          } else {
            // For string URLs, send as JSON array
            formData.append("articleImages", JSON.stringify(params.articleImages));
          }
        });
      }
    }

    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/articles/by-id/${params.articleId}`, {
      method: "PATCH",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to update article",
      };
    }

    return {
      success: true,
      message: result.message || "Article updated successfully",
      article: result.article,
    };
  } catch (error) {
    console.error("Update article error:", error);
    const errorMessage = error instanceof Error ? error.message : "Update article failed";
    
    // Check for specific error types
    if (errorMessage.includes("not found")) {
      return {
        success: false,
        message: "Article not found",
      };
    }
    
    if (errorMessage.includes("not authorized")) {
      return {
        success: false,
        message: "You are not authorized to update this article",
      };
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

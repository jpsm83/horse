"use server";

import { getBaseUrl } from "@/lib/utils/getBaseUrl";
import { cookies } from "next/headers";

export interface IDeleteArticleResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function deleteArticle(
  articleId: string
): Promise<IDeleteArticleResponse> {
  try {
    // Note: This action calls the API route because the route handles
    // Cloudinary image deletion before calling the service.
    const baseUrl = await getBaseUrl();
    
    // Get cookies to include in the request for session authentication
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const response = await fetch(`${baseUrl}/api/v1/articles/by-id/${articleId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to delete article",
      };
    }

    return {
      success: true,
      message: result.message || "Article deleted successfully!",
    };
  } catch (error) {
    console.error("Delete article failed:", error);
    const errorMessage = error instanceof Error ? error.message : "Delete article failed!";
    
    if (errorMessage.includes("Invalid article ID format")) {
      return {
        success: false,
        message: "Invalid article ID format!",
      };
    }
    
    if (errorMessage.includes("not found")) {
      return {
        success: false,
        message: "Article not found!",
      };
    }
    
    if (errorMessage.includes("not authorized")) {
      return {
        success: false,
        message: "You are not authorized to delete this article! Only administrators can delete articles.",
      };
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

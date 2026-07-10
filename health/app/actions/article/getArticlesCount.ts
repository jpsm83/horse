"use server";

import { getArticlesCountService } from "@/lib/services/articles";

export async function getArticlesCount(params: {
  category?: string;
  locale?: string;
} = {}): Promise<number> {
  try {
    return await getArticlesCountService(params);
  } catch (error) {
    console.error("Error getting articles count:", error);
    throw new Error(
      `Failed to get articles count: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}


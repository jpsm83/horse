"use server";

import { ISerializedArticle } from "@/types/article";
import { getAllArticlesForDashboardService } from "@/lib/services/articles";

export async function getAllArticlesForDashboard(): Promise<ISerializedArticle[]> {
  try {
    return await getAllArticlesForDashboardService();
  } catch (error) {
    console.error("Error fetching articles for dashboard:", error);
    return [];
  }
}

"use server";

import { getArticleStatsService, ArticleStats } from "@/lib/services/articles";

export async function getWeeklyStats(): Promise<ArticleStats> {
  try {
    return await getArticleStatsService();
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalArticles: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
    };
  }
}
